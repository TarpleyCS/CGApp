# Boeing 777 Weight & Balance Application

A comprehensive web application for Boeing 777 weight and balance calculations, featuring real-time center of gravity analysis, optimization algorithms, and interactive visualization.

## 🚀 Features

- **Real-time CG Calculation**: Instant weight and balance computations with envelope boundary checking
- **Interactive Chart**: Resizable, responsive chart with cursor tracking and envelope visualization  
- **Aircraft Variants**: Support for Boeing 777-300ER and 777-200LR configurations
- **Unit Conversion**: Seamless switching between pounds (LB) and kilograms (KG)
- **Optimization Tools**: 
  - Particle Swarm Optimization (PSO) for cargo arrangement
  - Integer Linear Programming (ILP) solver
  - Opportunity window analysis for CG flexibility
- **Database Integration**: IndexedDB storage for patterns, optimization history, and analytics
- **Responsive Design**: Mobile-friendly interface with collapsible sidebar
- **Testing Suite**: Comprehensive unit, integration, and component tests

## 🛠 Technology Stack

- **Framework**: Next.js 15.1.5 with React 19
- **TypeScript**: Full type safety throughout the application
- **Styling**: Tailwind CSS with custom components
- **Charts**: Recharts for interactive visualizations
- **Database**: IndexedDB with idb library for client-side storage
- **Testing**: Jest + Testing Library for comprehensive test coverage
- **Build Tools**: Turbopack for fast development builds

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun package manager

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cg2
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## 📖 Usage Guide

### Basic Operation

1. **Select Aircraft Variant**: Choose between 777-300ER or 777-200LR
2. **Choose Units**: Select pounds (LB) or kilograms (KG) for weight display
3. **Enter Cargo Weights**: Input weights for cargo positions using the loading grid
4. **Compute**: Calculate weight progression and center of gravity
5. **Add Fuel**: Load fuel after cargo is configured
6. **Analyze**: View results in the interactive chart and data tables

### Advanced Features

#### Optimization
- **Optimize Button**: Automatically rearranges cargo for envelope compliance
- **Max Forward CG**: Finds arrangement for maximum forward center of gravity  
- **Max Aft CG**: Finds arrangement for maximum aft center of gravity

#### Test Fill
- **Test Fill Button**: Automatically generates random test weights for all positions
- Useful for demonstration and testing envelope boundaries

#### Interactive Chart
- **Cursor Tracking**: Real-time display of weight and CG at cursor position
- **Envelope Visualization**: Operating limits, prohibited zones, and weight limits
- **Opportunity Window**: Shows range of possible CG positions
- **Draggable Labels**: Reposition chart labels for better readability

#### Tabs Interface
- **Chart**: Main visualization with interactive envelope and loading progression
- **Loading Data**: Detailed tabular view of calculation steps
- **Analytics**: Performance metrics and optimization history

## 🏗 Architecture

### Directory Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── button.tsx    # Button component with variants
│   │   ├── card.tsx      # Card container component
│   │   ├── input.tsx     # Input field component
│   │   ├── tabs.tsx      # Tabbed interface component
│   │   └── ...           # Other UI components
│   ├── loading-grid.tsx  # Weight input grid component
│   ├── loading-table.tsx # Data table component
│   ├── weight-calc.tsx   # Main calculation component
│   ├── weight-chart.tsx  # Interactive chart component
│   └── analytics-dashboard.tsx # Analytics display
├── hooks/                # Custom React hooks
│   └── useDatabase.ts    # Database connection hook
├── lib/                  # Core business logic
│   ├── calculations.ts   # Weight and balance calculations
│   ├── constants.ts      # Aircraft data and constants
│   ├── database.ts       # IndexedDB database layer
│   ├── optimization.ts   # PSO and ILP algorithms
│   ├── units.ts          # Unit conversion utilities
│   └── utils.ts          # General utility functions
└── __tests__/            # Test files
    ├── components/       # Component tests
    ├── lib/             # Unit tests for lib functions
    └── integration/     # Integration tests
```

### Key Components

#### WeightCalc (`src/components/weight-calc.tsx`)
Main application component that orchestrates:
- State management for weights, loading points, and configuration
- Calculation triggering and result processing
- Integration with optimization algorithms
- Fuel loading functionality

#### WeightChart (`src/components/weight-chart.tsx`)  
Interactive chart component featuring:
- Boeing 777 operating envelope visualization
- Real-time cursor position tracking
- Loading progression display
- Opportunity window visualization
- Draggable label system

#### Database Layer (`src/lib/database.ts`)
IndexedDB integration providing:
- Loading pattern storage and retrieval
- Optimization history tracking
- Performance analytics
- Custom position and pallet configuration

### Core Libraries

#### Calculations (`src/lib/calculations.ts`)
- `convertMomentArmToCG()`: Converts moment arms to CG percentages
- `getFuelArm()`: Interpolates fuel arm from weight using lookup table
- `calculateCumulativeWeights()`: Computes loading progression
- `addFuelToCalculation()`: Adds fuel loading to existing calculations

#### Optimization (`src/lib/optimization.ts`)
- **PSO Algorithm**: Particle swarm optimization for cargo arrangement
- **ILP Solver**: Integer linear programming for optimal solutions  
- **Fitness Functions**: Envelope compliance and CG target optimization
- **Constraint Functions**: Operating limit validation

## 🎯 Configuration

### Aircraft Data
Aircraft specifications are defined in `src/lib/constants.ts`:
- **POSITION_MAP**: Cargo position codes to moment arms
- **OEW_DATA**: Operating empty weight data for each variant
- **FUEL_CG_DATA**: Fuel center of gravity interpolation table
- **LOADING_PATTERNS**: Predefined cargo loading sequences

### Environment Variables
The application runs entirely client-side with no external dependencies.

## 🔧 Development

### Code Style
- **ESLint**: Configured with Next.js recommended rules
- **TypeScript**: Strict mode enabled for type safety
- **Prettier**: Code formatting (configure as needed)

### Adding New Features

1. **New Calculations**: Add functions to `src/lib/calculations.ts`
2. **New Optimizations**: Extend `src/lib/optimization.ts` 
3. **New Components**: Create in `src/components/` with corresponding tests
4. **New Constants**: Update `src/lib/constants.ts`

### Testing Guidelines
- **Unit Tests**: Test individual functions in isolation
- **Component Tests**: Test UI components and user interactions
- **Integration Tests**: Test complete workflows and component interactions
- **Coverage Target**: Maintain >80% code coverage

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deployment Options
- **Vercel**: Optimized for Next.js applications
- **Netlify**: Static site deployment
- **AWS Amplify**: Full-stack deployment  
- **Self-hosted**: Any static hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow
1. Write tests for new functionality
2. Implement features with TypeScript
3. Ensure all tests pass
4. Update documentation as needed
5. Submit PR with clear description

## 📚 API Reference

See [API_REFERENCE.md](./API_REFERENCE.md) for detailed function documentation.

## 🐛 Troubleshooting

### Common Issues

**Chart not displaying**: 
- Check browser console for errors
- Ensure data is properly formatted
- Verify chart dimensions are set

**Calculations incorrect**:
- Verify aircraft variant selection
- Check position codes in POSITION_MAP
- Validate weight input ranges

**Performance issues**:
- Reduce optimization iterations
- Limit opportunity window calculations
- Check for memory leaks in long sessions

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Boeing 777 Flight Crew Operating Manual for aircraft data
- Aviation industry standards for weight and balance procedures
- Open source community for excellent tooling and libraries

---

**Made with ❤️ for aviation professionals and enthusiasts**