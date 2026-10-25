// Dead Man's Run — the web game, packed into a native iPhone app.
// The game files live in the app bundle (the "www" folder) and are served over a private
// app:// address so everything works offline, sound included.
// Native extras: Taptic Engine haptics, iCloud saves, a branded launch screen.
import SwiftUI
import WebKit
import AVFoundation
import UniformTypeIdentifiers

@main
struct DeadMansRunApp: App {
    init() {
        // play alongside other audio and respect the ring/silent switch, like a game should
        try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default)
        try? AVAudioSession.sharedInstance().setActive(true)
        CloudSaves.shared.start()
        // coming back from the background (or a call): hand the audio session back to the game
        for name in [UIApplication.willEnterForegroundNotification, UIApplication.didBecomeActiveNotification, AVAudioSession.interruptionNotification] {
            NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { _ in
                try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default)
                try? AVAudioSession.sharedInstance().setActive(true)
            }
        }
    }
    var body: some Scene {
        WindowGroup {
            GameView()
                .ignoresSafeArea()
                .background(Color(red: 0.086, green: 0.051, blue: 0.027))
                .preferredColorScheme(.dark)
                .persistentSystemOverlays(.hidden)
        }
    }
}

struct GameView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: "app")
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.websiteDataStore = .default()
        let ucc = config.userContentController
        ucc.add(context.coordinator, name: "haptic")
        ucc.add(CloudSaves.shared, name: "cloud")
        // hand the game whatever iCloud holds before any of its code runs
        ucc.addUserScript(WKUserScript(source: "window.__cloud=\(CloudSaves.shared.snapshotJSON());",
                                       injectionTime: .atDocumentStart, forMainFrameOnly: true))
        // tell the game how warm the phone is and whether Low Power Mode is on, so it can trim effects before it throttles
        ucc.addUserScript(WKUserScript(source: PowerWatch.script(), injectionTime: .atDocumentStart, forMainFrameOnly: true))
        let web = WKWebView(frame: .zero, configuration: config)
        context.coordinator.power = PowerWatch(web)
        web.isOpaque = false
        web.backgroundColor = UIColor(red: 0.086, green: 0.051, blue: 0.027, alpha: 1)
        web.scrollView.backgroundColor = web.backgroundColor
        web.scrollView.bounces = false
        web.scrollView.isScrollEnabled = false
        web.scrollView.minimumZoomScale = 1
        web.scrollView.maximumZoomScale = 1
        web.scrollView.pinchGestureRecognizer?.isEnabled = false
        web.scrollView.showsVerticalScrollIndicator = false
        web.scrollView.showsHorizontalScrollIndicator = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.allowsLinkPreview = false
        if #available(iOS 16.4, *) { web.isInspectable = true }
        web.load(URLRequest(url: URL(string: "app://game/index.html")!))
        return web
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
    func makeCoordinator() -> Haptics { Haptics() }
}

/// Taptic Engine feedback. The game posts "light", "medium", "heavy", "soft", "rigid", "select", "success" or "error".
final class Haptics: NSObject, WKScriptMessageHandler {
    var power: PowerWatch?
    private let light = UIImpactFeedbackGenerator(style: .light)
    private let medium = UIImpactFeedbackGenerator(style: .medium)
    private let heavy = UIImpactFeedbackGenerator(style: .heavy)
    private let soft = UIImpactFeedbackGenerator(style: .soft)
    private let rigid = UIImpactFeedbackGenerator(style: .rigid)
    private let select = UISelectionFeedbackGenerator()
    private let note = UINotificationFeedbackGenerator()
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        switch m.body as? String ?? "" {
        case "light": light.impactOccurred()
        case "medium": medium.impactOccurred()
        case "heavy": heavy.impactOccurred(intensity: 1)
        case "soft": soft.impactOccurred(intensity: 0.6)
        case "rigid": rigid.impactOccurred()
        case "success": note.notificationOccurred(.success)
        case "error": note.notificationOccurred(.error)
        case "warning": note.notificationOccurred(.warning)
        default: select.selectionChanged()
        }
    }
}

/// Phone temperature and Low Power Mode, passed to the game whenever either changes.
/// thermal: 0 nominal, 1 fair, 2 serious, 3 critical.
final class PowerWatch {
    private weak var web: WKWebView?
    private var tokens: [NSObjectProtocol] = []
    init(_ web: WKWebView) {
        self.web = web
        for name in [ProcessInfo.thermalStateDidChangeNotification, Notification.Name.NSProcessInfoPowerStateDidChange] {
            tokens.append(NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                self?.web?.evaluateJavaScript(PowerWatch.script() + "window.onPower&&window.onPower();", completionHandler: nil)
            })
        }
    }
    deinit { tokens.forEach { NotificationCenter.default.removeObserver($0) } }
    static func script() -> String {
        let p = ProcessInfo.processInfo
        return "window.__power={thermal:\(p.thermalState.rawValue),low:\(p.isLowPowerModeEnabled ? "true" : "false")};"
    }
}

/// iCloud key-value saves: your records and the run in progress follow you to your other devices.
/// Works when the app is signed with the iCloud capability (paid Apple Developer account); otherwise it quietly does nothing.
final class CloudSaves: NSObject, WKScriptMessageHandler {
    static let shared = CloudSaves()
    private let store = NSUbiquitousKeyValueStore.default
    private let keys = ["deadmans-run-meta-v2", "deadmans-run-save-v3"]
    func start() { store.synchronize() }
    func snapshotJSON() -> String {
        var out: [String: Any] = [:]
        for k in keys { if let d = store.dictionary(forKey: k) { out[k] = d } }
        let data = (try? JSONSerialization.data(withJSONObject: out)) ?? Data("{}".utf8)
        return String(data: data, encoding: .utf8) ?? "{}"
    }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        guard let b = m.body as? [String: Any], let k = b["k"] as? String, keys.contains(k) else { return }
        var entry: [String: Any] = ["t": b["t"] as? Double ?? Date().timeIntervalSince1970 * 1000]
        if let v = b["v"] as? String { entry["v"] = v }
        store.set(entry, forKey: k)
    }
}

/// Serves files from the bundled "www" folder for app://game/... requests.
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    private let root = Bundle.main.url(forResource: "www", withExtension: nil)!

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = root.appendingPathComponent(String(path.dropFirst()))
        guard file.standardizedFileURL.path.hasPrefix(root.standardizedFileURL.path),
              let data = try? Data(contentsOf: file) else {
            let resp = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: nil)!
            task.didReceive(resp); task.didReceive(Data()); task.didFinish(); return
        }
        let mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        let resp = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                                   headerFields: ["Content-Type": mime, "Content-Length": "\(data.count)",
                                                  "Cache-Control": "no-cache"])!
        task.didReceive(resp)
        task.didReceive(data)
        task.didFinish()
    }
    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}
