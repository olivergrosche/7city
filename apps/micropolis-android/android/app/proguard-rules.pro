# 7CITY ProGuard/R8 rules — CURRENTLY DORMANT
#
# R8 is disabled (minifyEnabled false), so this file is not applied. It is
# kept because the rules below were verified to work on device: if R8 is ever
# enabled again, flip minifyEnabled/shrinkResources in build.gradle and these
# rules are ready. See KNOWN-ISSUES.md for the measurement and the reason it
# was deferred.
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
