class ApiConfig {
  /// Base URL para el servidor backend local de SOUL.
  ///
  /// - Pruebas en Chrome (flutter run -d chrome): usa 'http://localhost:3000/api'
  /// - Pruebas en Emulador Android:              usa 'http://10.0.2.2:3000/api'
  /// - Pruebas en Dispositivo Físico (WiFi):     usa 'http://<IP_LOCAL_PC>:3000/api'
  ///   (Ej: 'http://192.168.1.100:3000/api')
  static const String baseUrl = 'http://localhost:3000/api';

  /// Token de prueba rápida (NO recomendado en producción).
  /// Ahora la app usa autenticación real por pantalla de login.
  /// Déjalo en null para usar el flujo de login estándar.
  static const String? testingToken = null;
}
