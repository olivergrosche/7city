# 7CITY ProGuard/R8 rules
#
# Capacitor discovers plugins and bridges JS<->Java via reflection, so the
# plugin classes and their @PluginMethod entry points must survive shrinking.
# Verified on device: save-to-file (Filesystem + Share), slot save/load and
# cold-start restore all work with these rules.

-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public <methods>;
}
-keep class capacitor.android.plugins.** { *; }
-keep class io.super7.sevencity.** { *; }

# WebView JS interfaces are called by name from JavaScript.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
