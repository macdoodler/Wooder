# Wooder 🪵

**Advanced Cutting Optimization Tool for Woodworking Projects**

Wooder is a comprehensive Next.js application that optimizes material cutting for woodworking projects, featuring advanced algorithms for inventory management, multi-sheet optimization, grain direction enforcement, and comprehensive cut sequence generation.

## 🚀 Features

- **🎯 Advanced 5-Phase Cutting Algorithm** - Optimized placement engine with inventory-first strategy
- **📦 Inventory Management** - Smart warehouse stock management and utilization tracking
- **🔄 Multi-Sheet Optimization** - Cross-sheet optimization for maximum material efficiency
- **🌾 Grain Direction Enforcement** - Intelligent grain direction matching and rotation logic
- **📋 Cut Sequence Generation** - Step-by-step cutting instructions with safety guidelines
- **⚡ Quantity Handling** - Support for multiple instances of the same part
- **📊 Waste Minimization** - Advanced algorithms to reduce material waste
- **🔍 Collision Detection** - Prevents part overlap and ensures valid placements

## 🛠️ Getting Started

### Prerequisites
- Node.js 18.x or later
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/macdoodler/Wooder.git
cd Wooder

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🧪 Testing

The project includes comprehensive test suites:

```bash
# Run all tests
npx jest

# Run specific test suites
npx jest app/tests/quantity-fix-verification.test.ts
npx jest app/tests/grain-direction-enhancement.test.ts
```

## 📁 Project Structure

```
app/
├── lib/                    # Core algorithms and utilities
│   ├── optimized-cutting-engine.ts    # Main 5-phase optimization engine
│   ├── calculateOptimalCuts.ts        # Primary calculation function
│   ├── cutSequenceOptimizer.ts        # Cut sequence generation
│   └── types.ts                       # TypeScript type definitions
├── api/                    # API routes for data persistence
├── warehouse/              # Inventory management pages
└── tests/                  # Comprehensive test suites
```

## 🔧 Recent Improvements

- ✅ **Quantity Handling Fix** - Resolved critical issue where only one instance of each part could be placed
- ✅ **Grain Direction Enforcement** - Added strict grain direction matching with intelligent rotation
- ✅ **Collision Detection** - Enhanced algorithms to prevent part overlaps
- ✅ **Inventory Optimization** - Smart stock utilization and capacity validation
- ✅ **Cut Sequence Generation** - Safety-focused cutting instructions

## 📊 Algorithm Performance

- **Material Efficiency**: Up to 95% utilization on optimized layouts
- **Processing Speed**: Sub-second optimization for typical projects
- **Inventory Utilization**: Smart sheet selection minimizes waste
- **Safety Scoring**: Comprehensive safety analysis for cut sequences

## 🚀 Deployment

### Vercel (Recommended)
The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new):

```bash
npm run build
```

### Cloudflare (Advanced)
For Cloudflare deployment:

```bash
npm run deploy
```

## 📖 Documentation

For detailed documentation on specific features:

- [Quantity Handling Fix](./QUANTITY-HANDLING-FIX-COMPLETE.md)
- [Grain Direction Enhancement](./GRAIN-DIRECTION-VERIFICATION-COMPLETE.md)
- [Collision Detection](./COLLISION-DETECTION-FIX-COMPLETE.md)
- [Cut Sequence Optimization](./cut-sequence-optimization-complete.md)

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests for any improvements.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with [Next.js](https://nextjs.org) and optimized for professional woodworking applications.
