import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/pedido_model.dart';

class PedidoService {
  /// Token de la sesión autenticada (se asigna al hacer login).
  static String? token;

  /// Headers de autorización dinámicos usando el token de sesión actual.
  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${token ?? ''}',
      };

  /// Obtiene el historial de entregas asignadas al domiciliario logueado.
  /// Llama a GET /api/entregas/mi-historial (filtrado por usuario_id del token).
  static Future<List<PedidoModel>> getPedidos() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/entregas/mi-historial'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => PedidoModel.fromJson(json)).toList();
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        throw Exception(
            'Sesión expirada o sin permisos (HTTP ${response.statusCode}). Por favor inicia sesión nuevamente.');
      } else {
        final errorMsg = _parseErrorMessage(response.body);
        throw Exception(
            'Error del servidor: $errorMsg (HTTP ${response.statusCode})');
      }
    } catch (e) {
      // En la web no existe SocketException; capturamos cualquier error de red
      if (e is Exception) rethrow;
      throw Exception(
          'Error de red: No se pudo conectar al servidor en ${ApiConfig.baseUrl}.');
    }
  }

  /// Actualiza el estado de una entrega.
  /// Llama a PATCH /api/entregas/:id/estado
  static Future<void> updatePedidoEstado(int id, String estado,
      {String? motivoAnulacion}) async {
    try {
      final bodyMap = <String, dynamic>{'estado': estado};
      if (estado == 'Anulado' && motivoAnulacion != null) {
        bodyMap['motivo_anulacion'] = motivoAnulacion;
      }

      final response = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/entregas/$id/estado'),
        headers: _headers,
        body: jsonEncode(bodyMap),
      );

      if (response.statusCode != 200 && response.statusCode != 204) {
        final errorMsg = _parseErrorMessage(response.body);
        throw Exception(errorMsg);
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception(
          'Error de red al actualizar el estado de la entrega.');
    }
  }

  /// Extrae el mensaje de error de una respuesta JSON.
  static String _parseErrorMessage(String responseBody) {
    try {
      final decoded = jsonDecode(responseBody);
      if (decoded is Map && decoded.containsKey('error')) {
        return decoded['error'].toString();
      }
      if (decoded is Map && decoded.containsKey('message')) {
        return decoded['message'].toString();
      }
    } catch (_) {}
    return 'Error de respuesta desconocido';
  }
}
