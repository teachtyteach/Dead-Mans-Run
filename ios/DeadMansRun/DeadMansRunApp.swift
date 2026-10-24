// Dead Man's Run — the web game, packed into a native iPhone app.
// The game files live in the app bundle (the "www" folder) and are served over a private
// app:// address so everything works offline, sound included, and saves stay on the phone.
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
    }
    var body: some Scene {
        WindowGroup {
            GameView()
                .ignoresSafeArea()
                .background(Color(red: 0.086, green: 0.051, blue: 0.027))
                .statusBarHidden(false)
                .preferredColorScheme(.dark)
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
        config.userContentController.add(context.coordinator, name: "haptic")
        config.userContentController.add(context.coordinator, name: "haptic")
        let web = WKWebView(frame: .zero, configuration: config)
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

/// The game calls window.webkit.messageHandlers.haptic.postMessage("light"|"medium"|"heavy"|"select"|"success"|"error").
final class Haptics: NSObject, WKScriptMessageHandler {
    private let light = UIImpactFeedbackGenerator(style: .light)
    private let medium = UIImpactFeedbackGenerator(style: .medium)
    private let heavy = UIImpactFeedbackGenerator(style: .heavy)
    private let select = UISelectionFeedbackGenerator()
    private let note = UINotificationFeedbackGenerator()
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        switch m.body as? String ?? "" {
        case "light": light.impactOccurred()
        case "medium": medium.impactOccurred()
        case "heavy": heavy.impactOccurred(intensity: 1)
        case "select": select.selectionChanged()
        case "success": note.notificationOccurred(.success)
        case "error": note.notificationOccurred(.error)
        default: break
        }
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
