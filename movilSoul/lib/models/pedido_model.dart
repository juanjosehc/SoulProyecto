class PedidoItemModel {
  final String product;
  final String talla;
  final int cantidad;
  final double valorUnitario;
  final double total;

  PedidoItemModel({
    required this.product,
    required this.talla,
    required this.cantidad,
    required this.valorUnitario,
    required this.total,
  });

  factory PedidoItemModel.fromJson(Map<String, dynamic> json) {
    return PedidoItemModel(
      product: json['product']?.toString() ?? '',
      talla: json['talla']?.toString() ?? '',
      cantidad: _parseInt(json['cantidad']),
      valorUnitario: _parseDouble(json['valorUnitario']),
      total: _parseDouble(json['total']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'product': product,
      'talla': talla,
      'cantidad': cantidad,
      'valorUnitario': valorUnitario,
      'total': total,
    };
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }
}

class PedidoModel {
  final int id;
  final String code;
  final int? clienteId;
  final int? usuarioId;
  final String clientName;
  final String phone;
  final String deliveryAddress;
  final String deliveryDate;
  final String observations;
  final String orderStatus; // "Pendiente", "En tránsito", "Completado", "Anulado"
  final double total;
  final String createdAt;
  final String? motivoAnulacion;
  final String? domiciliarioName;
  final List<PedidoItemModel> items;
  final int itemsCount;

  PedidoModel({
    required this.id,
    required this.code,
    this.clienteId,
    this.usuarioId,
    required this.clientName,
    required this.phone,
    required this.deliveryAddress,
    required this.deliveryDate,
    required this.observations,
    required this.orderStatus,
    required this.total,
    required this.createdAt,
    this.motivoAnulacion,
    this.domiciliarioName,
    required this.items,
    required this.itemsCount,
  });

  factory PedidoModel.fromJson(Map<String, dynamic> json) {
    var rawItems = json['items'];
    List<PedidoItemModel> parsedItems = [];
    if (rawItems is List) {
      parsedItems = rawItems
          .map((item) => PedidoItemModel.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    return PedidoModel(
      id: _parseInt(json['id']),
      code: json['code']?.toString() ?? json['orderCode']?.toString() ?? json['codigo_pedido']?.toString() ?? '',
      clienteId: _parseNullableInt(json['clienteId'] ?? json['cliente_id']),
      usuarioId: _parseNullableInt(json['usuarioId'] ?? json['usuario_id']),
      clientName: json['clientName']?.toString() ?? json['nombre_cliente']?.toString() ?? '',
      phone: json['phone']?.toString() ?? json['telefono']?.toString() ?? '',
      deliveryAddress: json['deliveryAddress']?.toString() ?? json['address']?.toString() ?? json['direccion_entrega']?.toString() ?? '',
      deliveryDate: json['deliveryDate']?.toString() ?? json['date']?.toString() ?? json['fecha_entrega']?.toString() ?? '',
      observations: json['observations']?.toString() ?? json['notes']?.toString() ?? json['observaciones']?.toString() ?? '',
      orderStatus: json['orderStatus']?.toString() ?? json['status']?.toString() ?? json['estado']?.toString() ?? 'Pendiente',
      total: _parseDouble(json['total']),
      createdAt: json['created_at']?.toString() ?? json['createdAt']?.toString() ?? json['date']?.toString() ?? '',
      motivoAnulacion: json['motivoAnulacion']?.toString() ?? json['motivo_anulacion']?.toString(),
      domiciliarioName: json['domiciliarioName']?.toString() ?? json['deliveryPerson']?.toString(),
      items: parsedItems,
      itemsCount: _parseInt(json['itemsCount'] ?? parsedItems.length),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'clienteId': clienteId,
      'usuarioId': usuarioId,
      'clientName': clientName,
      'phone': phone,
      'deliveryAddress': deliveryAddress,
      'deliveryDate': deliveryDate,
      'observations': observations,
      'orderStatus': orderStatus,
      'total': total,
      'created_at': createdAt,
      'motivoAnulacion': motivoAnulacion,
      'domiciliarioName': domiciliarioName,
      'items': items.map((e) => e.toJson()).toList(),
      'itemsCount': itemsCount,
    };
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  static int? _parseNullableInt(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value);
    return null;
  }
}
