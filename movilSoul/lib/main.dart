import 'package:flutter/material.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(const SoulOrdersApp());
}

class SoulOrdersApp extends StatelessWidget {
  const SoulOrdersApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SOUL Pedidos',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFC9A24D), // Accent Gold
          onPrimary: Color(0xFF1E1605),
          primaryContainer: Color(0xFF3F3010),
          onPrimaryContainer: Color(0xFFFFE19C),
          secondary: Color(0xFFE2E2E5),
          onSecondary: Color(0xFF2F3033),
          background: Color(0xFF09090B), // Zinc 950
          onBackground: Color(0xFFF4F4F5), // Zinc 100
          surface: Color(0xFF18181B), // Zinc 900
          onSurface: Color(0xFFF4F4F5),
          surfaceVariant: Color(0xFF27272A), // Zinc 800
          onSurfaceVariant: Color(0xFFD4D4D8), // Zinc 300
          outline: Color(0xFF3F3F46), // Zinc 700
          error: Color(0xFFEF4444),
          onError: Colors.white,
          errorContainer: Color(0xFF450A0A),
          onErrorContainer: Color(0xFFFCA5A5),
        ),
        scaffoldBackgroundColor: const Color(0xFF09090B),
        cardTheme: CardThemeData(
          color: const Color(0xFF18181B),
          elevation: 0,
          shape: RoundedRectangleBorder(
            side: const BorderSide(color: Color(0xFF27272A), width: 1.0),
            borderRadius: BorderRadius.circular(16),
          ),
          clipBehavior: Clip.antiAlias,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF09090B),
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Color(0xFFF4F4F5),
            letterSpacing: 0.5,
          ),
          iconTheme: IconThemeData(color: Color(0xFFF4F4F5)),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFC9A24D),
            foregroundColor: const Color(0xFF1E1605),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            textStyle: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFFC9A24D),
            side: const BorderSide(color: Color(0xFFC9A24D), width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            textStyle: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: const Color(0xFFC9A24D),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            textStyle: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF18181B),
          hintStyle: const TextStyle(color: Color(0xFF71717A), fontSize: 15),
          labelStyle: const TextStyle(color: Color(0xFFA1A1AA)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF27272A)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF27272A)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFC9A24D), width: 1.5),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFEF4444)),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
          ),
        ),
        dividerTheme: const DividerThemeData(
          color: Color(0xFF27272A),
          thickness: 1,
          space: 24,
        ),
      ),
      home: const LoginScreen(),
    );
  }
}
