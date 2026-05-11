import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:math' as math;

void main() {
  runApp(const FloraApp());
}

class FloraApp extends StatelessWidget {
  const FloraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flora: 30 Plants Challenge',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2E4D44),
          primary: const Color(0xFF2E4D44),
          surface: const Color(0xFFF9F9F7),
        ),
        scaffoldBackgroundColor: const Color(0xFFF9F9F7),
        fontFamily: 'Inter', // Note: Ensure fonts are added to pubspec.yaml
      ),
      home: const ChallengePage(),
    );
  }
}

// --- Data Model ---

class PlantItem {
  final String id;
  final String name;
  final double pointValue;
  bool isChecked;

  PlantItem({
    required this.id,
    required this.name,
    required this.pointValue,
    this.isChecked = true,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'pointValue': pointValue,
        'isChecked': isChecked,
      };

  factory PlantItem.fromJson(Map<String, dynamic> json) => PlantItem(
        id: json['id'],
        name: json['name'],
        pointValue: json['pointValue'],
        isChecked: json['isChecked'],
      );
}

// --- State Management ---

class ChallengeProvider extends ChangeNotifier {
  List<PlantItem> _plants = [];
  List<PlantItem> get plants => _plants;

  ChallengeProvider() {
    _loadFromPrefs();
  }

  double get totalPoints => _plants
      .where((p) => p.isChecked)
      .fold(0.0, (sum, item) => sum + item.pointValue);

  void addPlant(String name, double value) {
    final cleanName = name.trim();
    if (cleanName.isEmpty) return;

    // Duplicate Prevention
    if (_plants.any((p) => p.name.toLowerCase() == cleanName.toLowerCase())) {
      return;
    }

    _plants.insert(
      0,
      PlantItem(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        name: cleanName,
        pointValue: value,
      ),
    );
    _saveToPrefs();
    notifyListeners();
  }

  void togglePlant(int index) {
    _plants[index].isChecked = !_plants[index].isChecked;
    _saveToPrefs();
    notifyListeners();
  }

  void removePlant(int index) {
    _plants.removeAt(index);
    _saveToPrefs();
    notifyListeners();
  }

  void resetWeek() {
    _plants = [];
    _saveToPrefs();
    notifyListeners();
  }

  Future<void> _saveToPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final String encoded = jsonEncode(_plants.map((p) => p.toJson()).toList());
    await prefs.setString('flora_plants', encoded);
  }

  Future<void> _loadFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final String? saved = prefs.getString('flora_plants');
    if (saved != null) {
      final List<dynamic> decoded = jsonDecode(saved);
      _plants = decoded.map((item) => PlantItem.fromJson(item)).toList();
      notifyListeners();
    }
  }
}

// --- UI Components ---

class ChallengePage extends StatefulWidget {
  const ChallengePage({super.key});

  @override
  State<ChallengePage> createState() => _ChallengePageState();
}

class _ChallengePageState extends State<ChallengePage> {
  final ChallengeProvider _provider = ChallengeProvider();
  final TextEditingController _searchController = TextEditingController();
  double _pointMode = 1.0;

  final Map<String, double> plantDictionary = {
  // --- VEGETABLES (1.0 Point) ---
  "Aubergine": 1.0, "Asparagus": 1.0, "Artichoke": 1.0, "Beetroot": 1.0, "Broccoli": 1.0,
  "Brussels Sprouts": 1.0, "Broad Beans": 1.0, "Cabbage (Green)": 1.0, "Cabbage (Red)": 1.0, "Carrot (Orange)": 1.0,
  "Carrot (Purple)": 1.0, "Cauliflower": 1.0, "Celery": 1.0, "Chard": 1.0, "Courgette": 1.0,
  "Cucumber": 1.0, "Fennel": 1.0, "Garlic": 1.0, "Green Beans (flat)": 1.0, "Green Beans (round)": 1.0, 
  "Kale": 1.0, "Leek": 1.0, "Mushroom (Button)": 1.0,
  "Mushroom (Shiitake)": 1.0, "Onion (Red)": 1.0, "Onion (White)": 1.0, "Onion (Purple)": 1.0,
   "Pak Choi": 1.0,"Parsnip": 1.0, "Peas": 1.0, 
  "Radish": 1.0, "Spinach": 1.0, "Spring Onions": 1.0, "Sweet Potato": 1.0, 
  "Shallots": 1.0, "Tomato (Red)": 1.0, "Tomato (Yellow)": 1.0, "Tomato (Black)": 1.0, "Watercress": 1.0, 

  // --- FRUITS (1.0 Point) ---
  "Apple (Green)": 1.0, "Apple (Red)": 1.0, "Apricot": 1.0,  "Avocado": 1.0, "Banana": 1.0, "Blueberries": 1.0,
  "Blackberries": 1.0, "Cherries": 1.0, "Chirimoya": 1.0, 
  "Grapefruit": 1.0, "Grapes (Green)": 1.0, "Grapes (Red)": 1.0,
  "Kiwi": 1.0, "Lemon": 1.0, "Lime": 1.0, "Loquat": 1.0,"Mango": 1.0, "Orange": 1.0, "Pear": 1.0, "Peach": 1.0,
  "Pineapple": 1.0, "Plum": 1.0, "Raspberries": 1.0, "Strawberries": 1.0,

  // --- GRAINS, LEGUMES & FERMENTED (1.0 Point) ---
  "Barley": 1.0, "Black Beans": 1.0, "Brown Rice": 1.0, "Chickpeas": 1.0, "Edamame": 1.0,
  "Kimchi": 1.0, "Lentils (Red)": 1.0, "Lentils (Green)": 1.0, "Miso": 1.0, "Oats": 1.0,
  "Quinoa (White)": 1.0, "Quinoa (Red)": 1.0, "Sauerkraut": 1.0, "Tempeh": 1.0, "Tofu": 1.0,
  "Kefir": 1.0, "Cheese": 1.0,"Extra Virgin Olive Oil": 1,

  // --- NUTS, SEEDS, SPICES & HERBS (0.5 Points) ---
  "Almonds": 0.5, "Basil": 0.5, "Brazil Nuts": 0.5, "Cashews": 0.5, "Chia Seeds": 0.5,
  "Chives": 0.5, "Cinnamon": 0.5, "Coriander": 0.5, "Cumin": 0.5, "Dill": 0.5, "Flaxseeds": 0.5,
  "Ginger": 0.5, "Hazelnuts": 0.5, "Hemp Seeds": 0.5, "Mint": 0.5, "Nutmeg": 0.5, "Oregano": 0.5,
  "Paprika": 0.5, "Parsley": 0.5, "Pecans": 0.5, "Pine Nuts": 0.5, "Pistachios": 0.5,
  "Pumpkin Seeds": 0.5, "Rosemary": 0.5, "Sesame Seeds": 0.5, "Sunflower Seeds": 0.5,
  "Turmeric": 0.5, "Walnuts": 0.5, 
    
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: ListenableBuilder(
            listenable: _provider,
            builder: (context, _) {
              return CustomScrollView(
                slivers: [
                  _buildHeader(),
                  SliverPadding(
                    padding: const EdgeInsets.all(20),
                    sliver: SliverToBoxAdapter(child: _buildInputSection()),
                  ),
                  _buildListSection(),
                  const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return SliverAppBar(
      pinned: true,
      expandedHeight: 220,
      backgroundColor: const Color(0xFFF9F9F7).withOpacity(0.9),
      flexibleSpace: FlexibleSpaceBar(
        background: Padding(
          padding: const EdgeInsets.only(top: 20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 120,
                    height: 120,
                    child: CircularProgressIndicator(
                      value: math.min(_provider.totalPoints / 30, 1.0),
                      strokeWidth: 10,
                      backgroundColor: Colors.black.withOpacity(0.05),
                      color: const Color(0xFF2E4D44),
                      strokeCap: StrokeCap.round,
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _provider.totalPoints.toStringAsFixed(1).replaceAll('.0', ''),
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF2E4D44),
                        ),
                      ),
                      Text(
                        'GOAL 30',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                          color: Color(0xFF2E4D44).withOpacity(0.4),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      title: const Text(
        'Flora',
        style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF2E4D44)),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh, color: Color(0xFF2E4D44)),
          onPressed: _showResetDialog,
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildInputSection() {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Autocomplete<String>(
              optionsBuilder: (TextEditingValue textEditingValue) {
                if (textEditingValue.text.isEmpty) return const Iterable<String>.empty();
                return plantDictionary.keys.where((String option) {
                  return option.toLowerCase().contains(textEditingValue.text.toLowerCase());
                });
              },
              onSelected: (String selection) {
                _provider.addPlant(selection, plantDictionary[selection] ?? _pointMode);
                _searchController.clear();
              },
              fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
                return TextField(
                  controller: controller,
                  focusNode: focusNode,
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search, size: 20, color: Color(0x331A1A1A)),
                    hintText: 'Search or add plant...',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                  onSubmitted: (value) {
                    _provider.addPlant(value, _pointMode);
                    controller.clear();
                  },
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFFF9F9F7),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                _pointButton(1.0),
                _pointButton(0.5),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _pointButton(double value) {
    bool isSelected = _pointMode == value;
    return GestureDetector(
      onTap: () => setState(() => _pointMode = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isSelected
              ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)]
              : [],
        ),
        child: Text(
          value.toStringAsFixed(1),
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: isSelected ? const Color(0xFF2E4D44) : Colors.black.withOpacity(0.2),
          ),
        ),
      ),
    );
  }

  Widget _buildListSection() {
    if (_provider.plants.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: Center(
          child: Opacity(
            opacity: 0.2,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.eco, size: 64),
                const SizedBox(height: 16),
                const Text('Your garden is empty',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final plant = _provider.plants[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Card(
                elevation: 0,
                color: plant.isChecked ? Colors.white : Colors.white.withOpacity(0.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                  side: BorderSide(
                    color: plant.isChecked ? Colors.transparent : const Color(0xFFF0EDE4),
                  ),
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  leading: GestureDetector(
                    onTap: () => _provider.togglePlant(index),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: plant.isChecked ? const Color(0xFF2E4D44) : Colors.transparent,
                        border: Border.all(
                          color: plant.isChecked ? Colors.transparent : const Color(0x202E4D44),
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: plant.isChecked
                          ? const Icon(Icons.check, color: Colors.white, size: 20)
                          : null,
                    ),
                  ),
                  title: Text(
                    plant.name,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      decoration: plant.isChecked ? null : TextDecoration.lineThrough,
                      color: plant.isChecked ? const Color(0xFF1A1A1A) : Colors.black26,
                    ),
                  ),
                  subtitle: Text(
                    '${plant.pointValue.toStringAsFixed(1)} PTS',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: plant.isChecked ? const Color(0xFF2E4D44) : Colors.black12,
                    ),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.black12),
                    onPressed: () => _provider.removePlant(index),
                  ),
                ),
              ),
            );
          },
          childCount: _provider.plants.length,
        ),
      ),
    );
  }

  void _showResetDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
        title: const Text('Reset Week?'),
        content: const Text('This will clear all your progress for the current week.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              _provider.resetWeek();
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Yes, Reset'),
          ),
        ],
      ),
    );
  }
}
