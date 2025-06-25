# Boeing 777 Weight & Balance Calculator

A web-based weight and balance calculation tool for Boeing 777-200LR and 777-300ER aircraft. This application provides center of gravity (CG) calculations for cargo and fuel loading operations.

## Features



### Cargo Loading
- **Pallet Positions**: All standard cargo positions for M Config (AL/AR through MR/ML, plus R position)
- **Loading Patterns**: Default, Forward, Aft, and Balanced loading sequences (need to adjust everything thats not default)
- **Real-time Calculations**: Live CG updates as cargo is loaded
- **Visual Envelope**: Interactive CG envelope chart with loading progression

### Fuel Management
- **Accurate Fuel CG**: Interpolated fuel center of gravity based on fuel quantity
- **Fuel Loading**: Add fuel to existing cargo configurations
- **Combined Analysis**: Total aircraft CG with cargo and fuel

### Visualization
- **CG Envelope Chart**: Visual representation of aircraft operating limits
- **Loading Progression**: Real-time plotting of loading sequence
- **Envelope Boundaries**: Operating limits, taxi weight, landing weight, and zero fuel weight limits
- **Alternative CG Limits**: Forward CG limit options for different configurations

## Technical Implementation

### Calculations

- Fuel CG interpolation from comprehensive lookup tables
- Cumulative weight and balance progression
- MAC (Mean Aerodynamic Chord) percentage calculations

### Data Sources
- Boeing 777 Flight Manual specifications
- Certified weight and balance data
- Operating Empty Weight (OEW) configurations for both variants

## Getting Started

### Development
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build
```bash
npm run build
npm start
```

## Deployment

This application is configured for GitHub Pages deployment with automatic builds via GitHub Actions.

**Live Demo**: [https://tarpleycs.github.io/CGApp/](https://tarpleycs.github.io/CGApp/)

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts for data visualization
- **Deployment**: GitHub Pages with static export

## Usage

1. **Select Aircraft Variant**: Choose between 777-300ER or 777-200LR
2. **Configure Loading**: Select loading pattern and add cargo weights
3. **Add Fuel**: Input fuel quantity for final CG calculation
4. **Analyze Results**: View CG progression on the envelope chart
5. **Optimize Loading**: Use built-in optimization tools for CG management

## Safety Notice

This tool is for planning purposes. All weight and balance calculations for actual flight operations must be verified using official Boeing documentation and approved airline procedures.
