package br.com.ymnegocios.desafiodocasal;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
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
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final String PREFS = "desafio_do_casal";
    private static final String KEY_URL = "web_app_url";
    private static final int NAVY = Color.rgb(11, 27, 51);
    private static final int BLUE = Color.rgb(37, 99, 235);
    private static final int BG = Color.rgb(245, 247, 250);
    private static final int TEXT = Color.rgb(25, 38, 58);
    private static final int MUTED = Color.rgb(96, 112, 133);

    private FrameLayout root;
    private WebView webView;
    private ProgressBar progress;
    private SharedPreferences prefs;
    private String currentUrl;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(NAVY);
        getWindow().setNavigationBarColor(NAVY);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        root = new FrameLayout(this);
        root.setBackgroundColor(BG);
        setContentView(root);
        currentUrl = prefs.getString(KEY_URL, "");
        if (isValidWebAppUrl(currentUrl)) openWebApp(currentUrl); else showSetupScreen();
    }

    private void showSetupScreen() {
        destroyWebView();
        root.removeAllViews();
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(BG);
        LinearLayout outer = new LinearLayout(this);
        outer.setOrientation(LinearLayout.VERTICAL);
        outer.setGravity(Gravity.CENTER_HORIZONTAL);
        outer.setPadding(dp(24), dp(44), dp(24), dp(36));
        scroll.addView(outer, new ScrollView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        TextView mark = new TextView(this);
        mark.setText("DC"); mark.setTextColor(Color.WHITE); mark.setTextSize(24); mark.setTypeface(Typeface.DEFAULT, Typeface.BOLD); mark.setGravity(Gravity.CENTER); mark.setBackgroundColor(BLUE);
        LinearLayout.LayoutParams markLp = new LinearLayout.LayoutParams(dp(72), dp(72)); markLp.bottomMargin = dp(20); outer.addView(mark, markLp);
        TextView brand = text("DESAFIO DO CASAL", 13, BLUE, true); brand.setLetterSpacing(0.08f); outer.addView(brand);
        TextView title = text("Conectar aplicativo", 28, TEXT, true); LinearLayout.LayoutParams titleLp = lpMatchWrap(); titleLp.topMargin = dp(8); outer.addView(title, titleLp);
        TextView subtitle = text("Cole a URL da implantação do Google Apps Script. Depois disso, o app abre direto no desafio.", 16, MUTED, false); subtitle.setGravity(Gravity.CENTER_HORIZONTAL); subtitle.setLineSpacing(0, 1.18f); LinearLayout.LayoutParams subLp = lpMatchWrap(); subLp.topMargin = dp(10); subLp.bottomMargin = dp(26); outer.addView(subtitle, subLp);
        EditText input = new EditText(this); input.setHint("https://script.google.com/macros/s/.../exec"); input.setText(currentUrl); input.setTextSize(15); input.setTextColor(TEXT); input.setHintTextColor(Color.rgb(145, 157, 173)); input.setSingleLine(false); input.setMinHeight(dp(58)); input.setPadding(dp(16), dp(12), dp(16), dp(12)); input.setBackgroundColor(Color.WHITE); outer.addView(input, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        TextView error = text("", 13, Color.rgb(185, 28, 28), false); LinearLayout.LayoutParams errLp = lpMatchWrap(); errLp.topMargin = dp(8); outer.addView(error, errLp);
        Button connect = new Button(this); connect.setText("Conectar e abrir"); connect.setTextColor(Color.WHITE); connect.setTextSize(16); connect.setTypeface(Typeface.DEFAULT, Typeface.BOLD); connect.setAllCaps(false); connect.setBackgroundColor(BLUE); LinearLayout.LayoutParams btnLp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(56)); btnLp.topMargin = dp(16); outer.addView(connect, btnLp);
        TextView note = text("A URL precisa terminar em /exec. Ela fica salva somente neste celular.", 13, MUTED, false); note.setGravity(Gravity.CENTER_HORIZONTAL); LinearLayout.LayoutParams noteLp = lpMatchWrap(); noteLp.topMargin = dp(18); outer.addView(note, noteLp);
        connect.setOnClickListener(v -> { String value = normalizeUrl(input.getText().toString()); if (!isValidWebAppUrl(value)) { error.setText("Cole a URL publicada do Apps Script terminando em /exec."); return; } error.setText(""); currentUrl = value; prefs.edit().putString(KEY_URL, value).apply(); openWebApp(value); });
        root.addView(scroll, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private void openWebApp(String url) {
        root.removeAllViews(); currentUrl = url; webView = new WebView(this); webView.setBackgroundColor(Color.WHITE);
        WebSettings settings = webView.getSettings(); settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true); settings.setLoadsImagesAutomatically(true); settings.setUseWideViewPort(true); settings.setLoadWithOverviewMode(false); settings.setBuiltInZoomControls(false); settings.setDisplayZoomControls(false); settings.setSupportZoom(false); settings.setMediaPlaybackRequiresUserGesture(true); settings.setUserAgentString(settings.getUserAgentString() + " DesafioDoCasalAndroid/1.0.1");
        CookieManager cookies = CookieManager.getInstance(); cookies.setAcceptCookie(true); cookies.setAcceptThirdPartyCookies(webView, true);
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal); progress.setMax(100); progress.setProgressTintList(android.content.res.ColorStateList.valueOf(BLUE)); progress.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(224, 231, 239)));
        webView.setWebChromeClient(new WebChromeClient() { @Override public void onProgressChanged(WebView view, int newProgress) { progress.setProgress(newProgress); progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE); } });
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { Uri uri = request.getUrl(); String scheme = uri.getScheme(); if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) return false; return true; }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) { if (request.isForMainFrame()) showConnectionError(); }
        });
        root.addView(webView, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        FrameLayout.LayoutParams progressLp = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(3)); progressLp.gravity = Gravity.TOP; root.addView(progress, progressLp);
        if (!hasInternet()) { showConnectionError(); return; }
        webView.loadUrl(url);
    }

    private void showConnectionError() {
        root.removeAllViews(); destroyWebView(); LinearLayout box = new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setGravity(Gravity.CENTER_HORIZONTAL | Gravity.CENTER_VERTICAL); box.setPadding(dp(28), dp(40), dp(28), dp(40)); box.setBackgroundColor(BG);
        TextView icon = text("!", 30, Color.WHITE, true); icon.setGravity(Gravity.CENTER); icon.setBackgroundColor(Color.rgb(220, 38, 38)); box.addView(icon, new LinearLayout.LayoutParams(dp(58), dp(58)));
        TextView title = text("Não foi possível abrir o desafio", 24, TEXT, true); title.setGravity(Gravity.CENTER_HORIZONTAL); LinearLayout.LayoutParams tlp = lpMatchWrap(); tlp.topMargin = dp(20); box.addView(title, tlp);
        TextView msg = text("Confira sua internet e tente novamente. Seus dados continuam no Google Sheets.", 15, MUTED, false); msg.setGravity(Gravity.CENTER_HORIZONTAL); LinearLayout.LayoutParams mlp = lpMatchWrap(); mlp.topMargin = dp(10); mlp.bottomMargin = dp(24); box.addView(msg, mlp);
        Button retry = new Button(this); retry.setText("Tentar novamente"); retry.setAllCaps(false); retry.setTextColor(Color.WHITE); retry.setBackgroundColor(BLUE); retry.setOnClickListener(v -> openWebApp(currentUrl)); box.addView(retry, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(54)));
        Button change = new Button(this); change.setText("Trocar endereço do app"); change.setAllCaps(false); change.setTextColor(BLUE); change.setBackgroundColor(Color.TRANSPARENT); change.setOnClickListener(v -> showSetupScreen()); LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(52)); clp.topMargin = dp(8); box.addView(change, clp);
        root.addView(box, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private boolean hasInternet() { ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE); if (cm == null || cm.getActiveNetwork() == null) return false; NetworkCapabilities caps = cm.getNetworkCapabilities(cm.getActiveNetwork()); return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET); }
    private String normalizeUrl(String raw) { return raw == null ? "" : raw.trim(); }
    private boolean isValidWebAppUrl(String value) { if (value == null || value.isEmpty()) return false; try { Uri uri = Uri.parse(value); return "https".equalsIgnoreCase(uri.getScheme()) && "script.google.com".equalsIgnoreCase(uri.getHost()) && uri.getPath() != null && uri.getPath().startsWith("/macros/s/") && uri.getPath().endsWith("/exec"); } catch (Exception ignored) { return false; } }
    private TextView text(String value, float sp, int color, boolean bold) { TextView tv = new TextView(this); tv.setText(value); tv.setTextSize(sp); tv.setTextColor(color); tv.setTypeface(Typeface.DEFAULT, bold ? Typeface.BOLD : Typeface.NORMAL); return tv; }
    private LinearLayout.LayoutParams lpMatchWrap() { return new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT); }
    private int dp(int value) { float density = getResources().getDisplayMetrics().density; return Math.round(value * density); }
    private void destroyWebView() { if (webView != null) { webView.stopLoading(); webView.setWebChromeClient(null); webView.setWebViewClient(null); webView.destroy(); webView = null; } }
    @Override public void onBackPressed() { if (webView != null && webView.canGoBack()) { webView.goBack(); return; } if (webView != null) { new AlertDialog.Builder(this).setTitle("Desafio do Casal").setItems(new String[]{"Continuar no app", "Recarregar", "Trocar endereço", "Fechar app"}, (dialog, which) -> { if (which == 1) webView.reload(); else if (which == 2) showSetupScreen(); else if (which == 3) finish(); }).show(); return; } super.onBackPressed(); }
    @Override protected void onDestroy() { destroyWebView(); super.onDestroy(); }
}
