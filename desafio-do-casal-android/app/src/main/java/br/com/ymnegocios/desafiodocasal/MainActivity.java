package br.com.ymnegocios.desafiodocasal;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.Typeface;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final String PREFS = "desafio_do_casal";
    private static final String KEY_URL = "web_app_url";

    private static final int NAVY = Color.rgb(11, 27, 51);
    private static final int YM_BLUE = Color.rgb(72, 77, 207);
    private static final int BG = Color.rgb(245, 247, 250);
    private static final int TEXT = Color.rgb(25, 38, 58);
    private static final int MUTED = Color.rgb(96, 112, 133);

    private FrameLayout root;
    private FrameLayout contentFrame;
    private WebView webView;
    private ProgressBar progress;
    private SharedPreferences prefs;
    private String currentUrl;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureSystemBars();

        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);

        root = new FrameLayout(this);
        root.setBackgroundColor(NAVY);

        contentFrame = new FrameLayout(this);
        contentFrame.setBackgroundColor(BG);
        root.addView(contentFrame, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        setContentView(root);
        configureSafeAreas();

        currentUrl = prefs.getString(KEY_URL, "");
        if (isValidWebAppUrl(currentUrl)) {
            openWebApp(currentUrl);
        } else {
            showSetupScreen();
        }
    }

    private void configureSystemBars() {
        Window window = getWindow();
        window.setStatusBarColor(NAVY);
        window.setNavigationBarColor(NAVY);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        window.getDecorView().setSystemUiVisibility(0);
    }

    private void configureSafeAreas() {
        if (Build.VERSION.SDK_INT >= 35) {
            root.setOnApplyWindowInsetsListener((view, windowInsets) -> {
                Insets safe = windowInsets.getInsets(
                        WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                contentFrame.setPadding(safe.left, safe.top, safe.right, safe.bottom);
                return windowInsets;
            });
            root.requestApplyInsets();
        } else {
            contentFrame.setPadding(0, 0, 0, 0);
        }
    }

    private void showSetupScreen() {
        destroyWebView();
        contentFrame.removeAllViews();
        contentFrame.setBackgroundColor(BG);

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(BG);
        scroll.setClipToPadding(false);

        LinearLayout outer = new LinearLayout(this);
        outer.setOrientation(LinearLayout.VERTICAL);
        outer.setGravity(Gravity.CENTER_HORIZONTAL);
        outer.setPadding(dp(24), dp(34), dp(24), dp(36));
        scroll.addView(outer, new ScrollView.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));

        ImageView mark = new ImageView(this);
        mark.setImageResource(R.drawable.ym_symbol);
        mark.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        mark.setContentDescription("YM Marketing & Negócios");
        LinearLayout.LayoutParams markLp = new LinearLayout.LayoutParams(dp(86), dp(86));
        markLp.bottomMargin = dp(16);
        outer.addView(mark, markLp);

        TextView brand = text("DESAFIO DO CASAL", 13, YM_BLUE, true);
        brand.setLetterSpacing(0.08f);
        outer.addView(brand);

        TextView byYm = text("por YM Marketing & Negócios", 13, MUTED, false);
        LinearLayout.LayoutParams byLp = lpMatchWrap();
        byLp.topMargin = dp(3);
        outer.addView(byYm, byLp);

        TextView title = text("Conectar aplicativo", 28, TEXT, true);
        title.setGravity(Gravity.CENTER_HORIZONTAL);
        LinearLayout.LayoutParams titleLp = lpMatchWrap();
        titleLp.topMargin = dp(18);
        outer.addView(title, titleLp);

        TextView subtitle = text(
                "Cole a URL da implantação do Google Apps Script. Depois disso, este celular abre direto no seu espaço.",
                16, MUTED, false);
        subtitle.setGravity(Gravity.CENTER_HORIZONTAL);
        subtitle.setLineSpacing(0, 1.18f);
        LinearLayout.LayoutParams subLp = lpMatchWrap();
        subLp.topMargin = dp(10);
        subLp.bottomMargin = dp(24);
        outer.addView(subtitle, subLp);

        EditText input = new EditText(this);
        input.setHint("https://script.google.com/macros/s/.../exec");
        input.setText(currentUrl);
        input.setTextSize(15);
        input.setTextColor(TEXT);
        input.setHintTextColor(Color.rgb(145, 157, 173));
        input.setSingleLine(false);
        input.setMinHeight(dp(58));
        input.setPadding(dp(16), dp(12), dp(16), dp(12));
        input.setBackgroundColor(Color.WHITE);
        outer.addView(input, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView error = text("", 13, Color.rgb(185, 28, 28), false);
        LinearLayout.LayoutParams errLp = lpMatchWrap();
        errLp.topMargin = dp(8);
        outer.addView(error, errLp);

        Button connect = new Button(this);
        connect.setText("Conectar e abrir");
        connect.setTextColor(Color.WHITE);
        connect.setTextSize(16);
        connect.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        connect.setAllCaps(false);
        connect.setBackgroundColor(YM_BLUE);
        LinearLayout.LayoutParams btnLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(56));
        btnLp.topMargin = dp(16);
        outer.addView(connect, btnLp);

        TextView note = text(
                "A URL precisa terminar em /exec e fica salva somente neste aparelho.",
                13, MUTED, false);
        note.setGravity(Gravity.CENTER_HORIZONTAL);
        LinearLayout.LayoutParams noteLp = lpMatchWrap();
        noteLp.topMargin = dp(18);
        outer.addView(note, noteLp);

        connect.setOnClickListener(v -> {
            String value = normalizeUrl(input.getText().toString());
            if (!isValidWebAppUrl(value)) {
                error.setText("Cole a URL publicada do Apps Script terminando em /exec.");
                return;
            }
            error.setText("");
            currentUrl = value;
            prefs.edit().putString(KEY_URL, value).apply();
            openWebApp(value);
        });

        contentFrame.addView(scroll, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private void openWebApp(String url) {
        contentFrame.removeAllViews();
        contentFrame.setBackgroundColor(Color.WHITE);
        currentUrl = url;

        webView = new WebView(this);
        webView.setBackgroundColor(Color.WHITE);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setTextZoom(100);
        settings.setUserAgentString(
                settings.getUserAgentString() + " DesafioDoCasalAndroid/1.0.3 YM");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setProgressTintList(
                android.content.res.ColorStateList.valueOf(YM_BLUE));
        progress.setBackgroundTintList(
                android.content.res.ColorStateList.valueOf(Color.rgb(224, 231, 239)));

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                return !("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme));
            }

            @Override
            public void onReceivedError(
                    WebView view,
                    WebResourceRequest request,
                    WebResourceError error) {
                if (request.isForMainFrame()) {
                    showConnectionError();
                }
            }
        });

        contentFrame.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        FrameLayout.LayoutParams progressLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(3));
        progressLp.gravity = Gravity.TOP;
        contentFrame.addView(progress, progressLp);

        if (!hasInternet()) {
            showConnectionError();
            return;
        }

        webView.loadUrl(url);
    }

    private void showConnectionError() {
        contentFrame.removeAllViews();
        destroyWebView();
        contentFrame.setBackgroundColor(BG);

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER_HORIZONTAL | Gravity.CENTER_VERTICAL);
        box.setPadding(dp(28), dp(40), dp(28), dp(40));
        box.setBackgroundColor(BG);

        ImageView mark = new ImageView(this);
        mark.setImageResource(R.drawable.ym_symbol);
        mark.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        box.addView(mark, new LinearLayout.LayoutParams(dp(74), dp(74)));

        TextView title = text("Não foi possível abrir o desafio", 24, TEXT, true);
        title.setGravity(Gravity.CENTER_HORIZONTAL);
        LinearLayout.LayoutParams tlp = lpMatchWrap();
        tlp.topMargin = dp(20);
        box.addView(title, tlp);

        TextView msg = text(
                "Confira sua internet e tente novamente. Seus dados continuam no Google Sheets.",
                15, MUTED, false);
        msg.setGravity(Gravity.CENTER_HORIZONTAL);
        LinearLayout.LayoutParams mlp = lpMatchWrap();
        mlp.topMargin = dp(10);
        mlp.bottomMargin = dp(24);
        box.addView(msg, mlp);

        Button retry = new Button(this);
        retry.setText("Tentar novamente");
        retry.setAllCaps(false);
        retry.setTextColor(Color.WHITE);
        retry.setBackgroundColor(YM_BLUE);
        retry.setOnClickListener(v -> openWebApp(currentUrl));
        box.addView(retry, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(54)));

        Button change = new Button(this);
        change.setText("Trocar endereço do app");
        change.setAllCaps(false);
        change.setTextColor(YM_BLUE);
        change.setBackgroundColor(Color.TRANSPARENT);
        change.setOnClickListener(v -> showSetupScreen());
        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(52));
        clp.topMargin = dp(8);
        box.addView(change, clp);

        contentFrame.addView(box, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private boolean hasInternet() {
        ConnectivityManager cm =
                (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null || cm.getActiveNetwork() == null) {
            return false;
        }
        NetworkCapabilities caps = cm.getNetworkCapabilities(cm.getActiveNetwork());
        return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    private String normalizeUrl(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private boolean isValidWebAppUrl(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }
        try {
            Uri uri = Uri.parse(value);
            return "https".equalsIgnoreCase(uri.getScheme())
                    && "script.google.com".equalsIgnoreCase(uri.getHost())
                    && uri.getPath() != null
                    && uri.getPath().startsWith("/macros/s/")
                    && uri.getPath().endsWith("/exec");
        } catch (Exception ignored) {
            return false;
        }
    }

    private TextView text(String value, float sp, int color, boolean bold) {
        TextView tv = new TextView(this);
        tv.setText(value);
        tv.setTextSize(sp);
        tv.setTextColor(color);
        tv.setTypeface(Typeface.DEFAULT, bold ? Typeface.BOLD : Typeface.NORMAL);
        return tv;
    }

    private LinearLayout.LayoutParams lpMatchWrap() {
        return new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
    }

    private int dp(int value) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(value * density);
    }

    private void destroyWebView() {
        if (webView != null) {
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
            webView = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }

        if (webView != null) {
            new AlertDialog.Builder(this)
                    .setTitle("Desafio do Casal")
                    .setItems(
                            new String[]{
                                    "Continuar no app",
                                    "Recarregar",
                                    "Trocar endereço",
                                    "Fechar app"
                            },
                            (dialog, which) -> {
                                if (which == 1) {
                                    webView.reload();
                                } else if (which == 2) {
                                    showSetupScreen();
                                } else if (which == 3) {
                                    finish();
                                }
                            })
                    .show();
            return;
        }

        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        destroyWebView();
        super.onDestroy();
    }
}
