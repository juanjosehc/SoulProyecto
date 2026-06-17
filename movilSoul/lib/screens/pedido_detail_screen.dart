import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/pedido_model.dart';
import '../services/pedido_service.dart';

class PedidoDetailScreen extends StatefulWidget {
  final PedidoModel pedido;
  final VoidCallback onOrderUpdated;

  const PedidoDetailScreen({
    super.key,
    required this.pedido,
    required this.onOrderUpdated,
  });

  @override
  State<PedidoDetailScreen> createState() => _PedidoDetailScreenState();
}

class _PedidoDetailScreenState extends State<PedidoDetailScreen> {
  late PedidoModel _pedido;
  bool _isUpdating = false;

  @override
  void initState() {
    super.initState();
    _pedido = widget.pedido;
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy').format(dt);
    } catch (_) {
      return dateStr;
    }
  }

  Future<void> _updateState(String nuevoEstado, {String? motivoAnulacion}) async {
    setState(() {
      _isUpdating = true;
    });

    try {
      await PedidoService.updatePedidoEstado(
        _pedido.id,
        nuevoEstado,
        motivoAnulacion: motivoAnulacion,
      );

      // Create a new updated order object to refresh UI locally
      final updatedOrder = PedidoModel(
        id: _pedido.id,
        code: _pedido.code,
        clienteId: _pedido.clienteId,
        usuarioId: _pedido.usuarioId,
        clientName: _pedido.clientName,
        phone: _pedido.phone,
        deliveryAddress: _pedido.deliveryAddress,
        deliveryDate: _pedido.deliveryDate,
        observations: _pedido.observations,
        orderStatus: nuevoEstado,
        total: _pedido.total,
        createdAt: _pedido.createdAt,
        motivoAnulacion: nuevoEstado == 'Anulado' ? (motivoAnulacion ?? '') : _pedido.motivoAnulacion,
        domiciliarioName: _pedido.domiciliarioName,
        items: _pedido.items,
        itemsCount: _pedido.itemsCount,
      );

      setState(() {
        _pedido = updatedOrder;
        _isUpdating = false;
      });

      // Call parent refresh callback
      widget.onOrderUpdated();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Pedido actualizado a "$nuevoEstado" con éxito.'),
          backgroundColor: nuevoEstado == 'Completado'
              ? const Color(0xFF082814)
              : nuevoEstado == 'Anulado'
                  ? const Color(0xFF2C0F0F)
                  : const Color(0xFF18181B),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      setState(() {
        _isUpdating = false;
      });

      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.error_outline, color: Color(0xFFEF4444)),
              SizedBox(width: 8),
              Text('Error de Actualización'),
            ],
          ),
          content: Text(e.toString().replaceAll('Exception: ', '')),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Entendido'),
            ),
          ],
        ),
      );
    }
  }

  void _showAnularDialog() {
    final controller = TextEditingController();
    bool isReasonEmpty = true;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Text('Anular Pedido'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Por favor ingresa la justificación o el motivo de la anulación del pedido:',
                  style: TextStyle(fontSize: 14, color: Color(0xFFD4D4D8)),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: controller,
                  maxLines: 3,
                  autofocus: true,
                  onChanged: (text) {
                    setDialogState(() {
                      isReasonEmpty = text.trim().isEmpty;
                    });
                  },
                  decoration: const InputDecoration(
                    hintText: 'Ej. Solicitado por el cliente, falta de cobertura, stock agotado...',
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancelar', style: TextStyle(color: Color(0xFFA1A1AA))),
              ),
              ElevatedButton(
                onPressed: isReasonEmpty
                    ? null
                    : () {
                        Navigator.pop(context);
                        _updateState('Anulado', motivoAnulacion: controller.text.trim());
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEF4444),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: const Color(0xFFEF4444).withOpacity(0.3),
                ),
                child: const Text('Confirmar Anulación'),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color bgColor;
    Color textColor;
    IconData icon;

    switch (status) {
      case 'Pendiente':
        bgColor = const Color(0xFF2C1E0A);
        textColor = const Color(0xFFFFB26B);
        icon = Icons.hourglass_empty_rounded;
        break;
      case 'En tránsito':
        bgColor = const Color(0xFF0C243B);
        textColor = const Color(0xFF6BA4FF);
        icon = Icons.local_shipping_outlined;
        break;
      case 'Completado':
        bgColor = const Color(0xFF082814);
        textColor = const Color(0xFF6BFF8A);
        icon = Icons.check_circle_outline_rounded;
        break;
      case 'Anulado':
        bgColor = const Color(0xFF2C0F0F);
        textColor = const Color(0xFFFF6B6B);
        icon = Icons.cancel_outlined;
        break;
      default:
        bgColor = const Color(0xFF1C1C1E);
        textColor = const Color(0xFFA1A1AA);
        icon = Icons.help_outline_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withOpacity(0.2), width: 1.2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: textColor, size: 16),
          const SizedBox(width: 6),
          Text(
            status,
            style: TextStyle(
              color: textColor,
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: const Color(0xFFC9A24D)),
        const SizedBox(width: 8),
        Text(
          title.toUpperCase(),
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: Color(0xFFC9A24D),
            letterSpacing: 1.5,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(_pedido.code),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Cabecera Principal (Resumen Rápido)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Estado del Pedido',
                              style: TextStyle(
                                fontSize: 14,
                                color: Color(0xFFA1A1AA),
                              ),
                            ),
                            _buildStatusChip(_pedido.orderStatus),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(height: 1),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Fecha de Entrega:',
                              style: TextStyle(fontSize: 13, color: Color(0xFF71717A)),
                            ),
                            Text(
                              _formatDate(_pedido.createdAt),
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFFD4D4D8),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Motivo de Anulación (Alerta si aplica)
                if (_pedido.orderStatus == 'Anulado') ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2C0F0F),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 20),
                            SizedBox(width: 8),
                            Text(
                              'DETALLE DE ANULACIÓN',
                              style: TextStyle(
                                color: Color(0xFFEF4444),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _pedido.motivoAnulacion != null && _pedido.motivoAnulacion!.isNotEmpty
                              ? _pedido.motivoAnulacion!
                              : 'No se especificó un motivo de cancelación.',
                          style: const TextStyle(
                            color: Color(0xFFFCA5A5),
                            fontSize: 14,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Información del Cliente
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSectionHeader('Datos del Cliente & Entrega', Icons.person_outline),
                        const SizedBox(height: 14),
                        Text(
                          _pedido.clientName,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            const Icon(Icons.phone_outlined, size: 16, color: Color(0xFFA1A1AA)),
                            const SizedBox(width: 10),
                            Text(
                              _pedido.phone,
                              style: const TextStyle(fontSize: 14, color: Color(0xFFD4D4D8)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.location_on_outlined, size: 16, color: Color(0xFFA1A1AA)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _pedido.deliveryAddress,
                                style: const TextStyle(fontSize: 14, color: Color(0xFFD4D4D8), height: 1.3),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            const Icon(Icons.calendar_today_outlined, size: 16, color: Color(0xFFA1A1AA)),
                            const SizedBox(width: 10),
                            Text(
                              'Fecha Pactada: ${_formatDate(_pedido.deliveryDate)}',
                              style: const TextStyle(fontSize: 14, color: Color(0xFFD4D4D8)),
                            ),
                          ],
                        ),
                        if (_pedido.observations.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          const Divider(height: 1),
                          const SizedBox(height: 12),
                          const Text(
                            'Observaciones:',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF71717A),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.background,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: theme.colorScheme.outline.withOpacity(0.3)),
                            ),
                            child: Text(
                              _pedido.observations,
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFFA1A1AA),
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Domiciliario Asignado
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSectionHeader('Domiciliario Responsable', Icons.pedal_bike),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: _pedido.domiciliarioName != null
                                    ? theme.colorScheme.primary.withOpacity(0.1)
                                    : theme.colorScheme.outline.withOpacity(0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                _pedido.domiciliarioName != null ? Icons.directions_bike : Icons.help_outline,
                                color: _pedido.domiciliarioName != null
                                    ? const Color(0xFFC9A24D)
                                    : const Color(0xFF71717A),
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _pedido.domiciliarioName ?? 'No Asignado',
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: _pedido.domiciliarioName != null
                                          ? Colors.white
                                          : const Color(0xFF71717A),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    _pedido.domiciliarioName != null
                                        ? 'Asignado para la entrega móvil'
                                        : 'Aún no se ha asignado personal',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF71717A)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Lista de Productos
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSectionHeader('Resumen de Productos', Icons.shopping_cart_outlined),
                        const SizedBox(height: 14),
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _pedido.items.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final item = _pedido.items[index];
                            return Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.surfaceVariant.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: theme.colorScheme.outline.withOpacity(0.2),
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: theme.colorScheme.primary.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Icon(Icons.inventory_2_outlined, color: Color(0xFFC9A24D), size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item.product,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                            color: Colors.white,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: theme.colorScheme.outline.withOpacity(0.3),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                'Talla: ${item.talla}',
                                                style: const TextStyle(fontSize: 11, color: Color(0xFFD4D4D8)),
                                              ),
                                            ),
                                            const SizedBox(width: 10),
                                            Text(
                                              '${item.cantidad} x ${NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0).format(item.valorUnitario)}',
                                              style: const TextStyle(fontSize: 12, color: Color(0xFFA1A1AA)),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    NumberFormat.currency(
                                      locale: 'es_CO',
                                      symbol: '\$',
                                      decimalDigits: 0,
                                    ).format(item.total),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      color: Color(0xFFF4F4F5),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 16),
                        const Divider(height: 1),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'TOTAL A PAGAR:',
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 14,
                                color: Colors.white,
                                letterSpacing: 0.5,
                              ),
                            ),
                            Text(
                              NumberFormat.currency(
                                locale: 'es_CO',
                                symbol: '\$',
                                decimalDigits: 0,
                              ).format(_pedido.total),
                              style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 22,
                                color: Color(0xFFC9A24D),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Botones de Acción (State transitions bottom bar)
          if (_pedido.orderStatus == 'Pendiente' || _pedido.orderStatus == 'En tránsito')
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF18181B),
                  border: Border(top: BorderSide(color: theme.colorScheme.outline.withOpacity(0.3), width: 1)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.4),
                      blurRadius: 10,
                      offset: const Offset(0, -2),
                    )
                  ],
                ),
                child: SafeArea(
                  child: Row(
                    children: [
                      if (_pedido.orderStatus == 'Pendiente')
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _isUpdating ? null : () => _updateState('En tránsito'),
                            icon: const Icon(Icons.local_shipping),
                            label: const Text('Iniciar Entrega'),
                          ),
                        ),
                      if (_pedido.orderStatus == 'En tránsito') ...[
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _isUpdating ? null : _showAnularDialog,
                            icon: const Icon(Icons.cancel_outlined, color: Color(0xFFEF4444)),
                            label: const Text('Anular', style: TextStyle(color: Color(0xFFEF4444))),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _isUpdating ? null : () => _updateState('Completado'),
                            icon: const Icon(Icons.check_circle),
                            label: const Text('Entregar'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF22C55E),
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),

          // Pantalla de carga superpuesta
          if (_isUpdating)
            Container(
              color: Colors.black.withOpacity(0.6),
              child: Center(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const CircularProgressIndicator(color: Color(0xFFC9A24D)),
                        const SizedBox(height: 16),
                        Text(
                          'Actualizando pedido...',
                          style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
