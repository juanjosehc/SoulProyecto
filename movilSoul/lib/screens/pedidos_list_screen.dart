import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/pedido_model.dart';
import '../services/pedido_service.dart';
import 'login_screen.dart';
import 'pedido_detail_screen.dart';

class PedidosListScreen extends StatefulWidget {
  final String userName;
  final String userRol;
  const PedidosListScreen({
    super.key,
    this.userName = 'Domiciliario',
    this.userRol = '',
  });

  @override
  State<PedidosListScreen> createState() => _PedidosListScreenState();
}

class _PedidosListScreenState extends State<PedidosListScreen> {
  List<PedidoModel> _pedidos = [];
  List<PedidoModel> _filteredPedidos = [];
  bool _isLoading = false;
  String _errorMessage = '';
  String _searchQuery = '';
  String _selectedStatus = 'En tránsito';

  final TextEditingController _searchController = TextEditingController();

  final List<String> _statusFilters = [
    'Todos',
    'En tránsito',
    'Completado',
    'Anulado',
  ];

  @override
  void initState() {
    super.initState();
    _fetchPedidos();
  }

  Future<void> _fetchPedidos() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final pedidos = await PedidoService.getPedidos();
      setState(() {
        _pedidos = pedidos;
        _applyFiltersAndSearch();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _applyFiltersAndSearch() {
    List<PedidoModel> temp = List.from(_pedidos);

    // Apply status filter
    if (_selectedStatus != 'Todos') {
      temp = temp.where((p) => p.orderStatus.toLowerCase() == _selectedStatus.toLowerCase()).toList();
    }

    // Apply search query
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      temp = temp.where((p) {
        return p.code.toLowerCase().contains(query) ||
            p.clientName.toLowerCase().contains(query) ||
            p.phone.toLowerCase().contains(query) ||
            p.deliveryAddress.toLowerCase().contains(query);
      }).toList();
    }

    setState(() {
      _filteredPedidos = temp;
    });
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy').format(dt);
    } catch (_) {
      return dateStr;
    }
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withOpacity(0.2), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: textColor, size: 14),
          const SizedBox(width: 4),
          Text(
            status,
            style: TextStyle(
              color: textColor,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'SOUL',
                style: TextStyle(
                  color: theme.colorScheme.onPrimary,
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  letterSpacing: 1,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Text('Mis Entregas'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Actualizar entregas',
            onPressed: _isLoading ? null : _fetchPedidos,
          ),
          Padding(
            padding: const EdgeInsets.only(right: 4),
            child: PopupMenuButton<String>(
              icon: CircleAvatar(
                backgroundColor: theme.colorScheme.primary.withOpacity(0.15),
                radius: 18,
                child: Icon(Icons.person_outline,
                    color: theme.colorScheme.primary, size: 20),
              ),
              offset: const Offset(0, 48),
              itemBuilder: (_) => [
                PopupMenuItem<String>(
                  enabled: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.userName,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            fontSize: 14),
                      ),
                      if (widget.userRol.isNotEmpty)
                        Text(
                          widget.userRol,
                          style: const TextStyle(
                              color: Color(0xFFA1A1AA), fontSize: 12),
                        ),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem<String>(
                  value: 'logout',
                  child: Row(
                    children: [
                      Icon(Icons.logout, color: Color(0xFFEF4444), size: 18),
                      SizedBox(width: 10),
                      Text('Cerrar Sesión',
                          style: TextStyle(color: Color(0xFFEF4444))),
                    ],
                  ),
                ),
              ],
              onSelected: (value) {
                if (value == 'logout') {
                  PedidoService.token = null;
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                    (route) => false,
                  );
                }
              },
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchPedidos,
        color: theme.colorScheme.primary,
        backgroundColor: theme.colorScheme.surface,
        child: Column(
          children: [
            // Search Bar & Filter Indicators
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: TextField(
                controller: _searchController,
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                  _applyFiltersAndSearch();
                },
                decoration: InputDecoration(
                  hintText: 'Buscar por código, cliente, dirección...',
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF71717A)),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: Color(0xFF71717A)),
                          onPressed: () {
                            _searchController.clear();
                            setState(() {
                              _searchQuery = '';
                            });
                            _applyFiltersAndSearch();
                          },
                        )
                      : null,
                ),
              ),
            ),

            // Horizontal Filter Chips
            SizedBox(
              height: 48,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: _statusFilters.length,
                itemBuilder: (context, index) {
                  final status = _statusFilters[index];
                  final isSelected = _selectedStatus == status;
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(status),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _selectedStatus = status;
                          });
                          _applyFiltersAndSearch();
                        }
                      },
                      selectedColor: theme.colorScheme.primary.withOpacity(0.15),
                      checkmarkColor: theme.colorScheme.primary,
                      side: BorderSide(
                        color: isSelected
                            ? theme.colorScheme.primary
                            : theme.colorScheme.outline.withOpacity(0.5),
                        width: 1,
                      ),
                      labelStyle: TextStyle(
                        color: isSelected ? theme.colorScheme.primary : const Color(0xFFA1A1AA),
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                      backgroundColor: theme.colorScheme.surface,
                    ),
                  );
                },
              ),
            ),

            // Main Content Area
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(),
                    )
                  : _errorMessage.isNotEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24.0),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.cloud_off, size: 64, color: Color(0xFFEF4444)),
                                const SizedBox(height: 16),
                                Text(
                                  'Error de Comunicación',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _errorMessage,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(color: Color(0xFFA1A1AA)),
                                ),
                                const SizedBox(height: 24),
                                TextButton.icon(
                                  onPressed: _fetchPedidos,
                                  icon: const Icon(Icons.refresh),
                                  label: const Text('Reintentar Conexión'),
                                ),
                              ],
                            ),
                          ),
                        )
                      : _filteredPedidos.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.inventory_2_outlined, size: 64, color: theme.colorScheme.outline),
                                  const SizedBox(height: 16),
                                  const Text(
                                    'No se encontraron entregas',
                                    style: TextStyle(
                                      color: Color(0xFFA1A1AA),
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Intenta cambiar los filtros de búsqueda.',
                                    style: TextStyle(color: Color(0xFF71717A), fontSize: 13),
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                              itemCount: _filteredPedidos.length,
                              itemBuilder: (context, index) {
                                final pedido = _filteredPedidos[index];
                                return Card(
                                  margin: const EdgeInsets.only(bottom: 14),
                                  child: InkWell(
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => PedidoDetailScreen(
                                            pedido: pedido,
                                            onOrderUpdated: _fetchPedidos,
                                          ),
                                        ),
                                      ).then((_) {
                                        _fetchPedidos();
                                      });
                                    },
                                    child: Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Row(
                                                children: [
                                                  const Icon(
                                                    Icons.receipt_long,
                                                    size: 18,
                                                    color: Color(0xFFC9A24D),
                                                  ),
                                                  const SizedBox(width: 6),
                                                  Text(
                                                    pedido.code,
                                                    style: const TextStyle(
                                                      fontSize: 16,
                                                      fontWeight: FontWeight.w800,
                                                      color: Colors.white,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              _buildStatusChip(pedido.orderStatus),
                                            ],
                                          ),
                                          const SizedBox(height: 12),
                                          Text(
                                            pedido.clientName,
                                            style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFFE2E2E5),
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              const Icon(Icons.phone, size: 14, color: Color(0xFFA1A1AA)),
                                              const SizedBox(width: 8),
                                              Text(
                                                pedido.phone,
                                                style: const TextStyle(fontSize: 13, color: Color(0xFFA1A1AA)),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Row(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const Icon(Icons.location_on, size: 14, color: Color(0xFFA1A1AA)),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  pedido.deliveryAddress,
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: const TextStyle(fontSize: 13, color: Color(0xFFA1A1AA)),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              const Icon(Icons.calendar_today, size: 14, color: Color(0xFF71717A)),
                                              const SizedBox(width: 8),
                                              Text(
                                                'Entrega: ${_formatDate(pedido.deliveryDate)}',
                                                style: const TextStyle(fontSize: 12, color: Color(0xFF71717A)),
                                              ),
                                            ],
                                          ),
                                          const Divider(height: 24),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Row(
                                                children: [
                                                  Icon(
                                                    Icons.shopping_bag_outlined,
                                                    size: 16,
                                                    color: theme.colorScheme.primary.withOpacity(0.7),
                                                  ),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    '${pedido.itemsCount} ${pedido.itemsCount == 1 ? "artículo" : "artículos"}',
                                                    style: const TextStyle(
                                                      fontSize: 13,
                                                      color: Color(0xFFA1A1AA),
                                                      fontWeight: FontWeight.w500,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              Text(
                                                NumberFormat.currency(
                                                  locale: 'es_CO',
                                                  symbol: '\$',
                                                  decimalDigits: 0,
                                                ).format(pedido.total),
                                                style: const TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.w900,
                                                  color: Color(0xFFC9A24D),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
            ),
          ],
        ),
      ),
    );
  }
}
