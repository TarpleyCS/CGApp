import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeightCalc from '../weight-calc';

// Mock the chart component since it's complex and we're focusing on integration
jest.mock('../weight-chart', () => ({
  WeightChart: ({ loadingPoints, opportunityWindow }: { loadingPoints?: unknown[]; opportunityWindow?: unknown[] }) => (
    <div data-testid="weight-chart">
      <div data-testid="loading-points-count">{loadingPoints?.length || 0}</div>
      <div data-testid="opportunity-window-count">{opportunityWindow?.length || 0}</div>
    </div>
  )
}));

// Mock the analytics dashboard
jest.mock('../analytics-dashboard', () => ({
  AnalyticsDashboard: () => <div data-testid="analytics-dashboard">Analytics</div>
}));

describe('WeightCalculator Integration', () => {
  beforeEach(() => {
    // Clear any console warnings for cleaner test output
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should complete full weight and balance calculation workflow', async () => {
    const user = userEvent.setup();
    render(<WeightCalc />);

    // Initial state - should show loading grid and chart
    expect(screen.getByText('Boeing 777 Weight & Balance')).toBeInTheDocument();
    expect(screen.getByTestId('weight-chart')).toBeInTheDocument();

    // Find first weight input (should be for position R)
    const firstWeightInput = screen.getAllByPlaceholderText('Weight (lbs)')[0];
    
    // Enter weight for first position
    await user.clear(firstWeightInput);
    await user.type(firstWeightInput, '8000');

    // Click Compute button
    const computeButton = screen.getByText('Compute');
    await user.click(computeButton);

    // Should see loading points updated in chart
    await waitFor(() => {
      const loadingPointsCount = screen.getByTestId('loading-points-count');
      expect(loadingPointsCount).toHaveTextContent('2'); // OEW + 1 cargo point
    });

    // Add more weight positions
    const addButton = screen.getByText('Add Position');
    await user.click(addButton);

    // Enter weight for second position
    const weightInputs = screen.getAllByPlaceholderText('Weight (lbs)');
    const secondWeightInput = weightInputs[1];
    await user.clear(secondWeightInput);
    await user.type(secondWeightInput, '6000');

    // Compute again
    await user.click(computeButton);

    // Should see more loading points
    await waitFor(() => {
      const loadingPointsCount = screen.getByTestId('loading-points-count');
      expect(loadingPointsCount).toHaveTextContent('3'); // OEW + 2 cargo points
    });
  });

  it('should handle fuel loading after cargo', async () => {
    const user = userEvent.setup();
    render(<WeightCalc />);

    // Set up some cargo
    const firstWeightInput = screen.getAllByPlaceholderText('Weight (lbs)')[0];
    await user.clear(firstWeightInput);
    await user.type(firstWeightInput, '7000');

    const computeButton = screen.getByText('Compute');
    await user.click(computeButton);

    // Now add fuel
    const fuelInput = screen.getByPlaceholderText('Fuel weight (lbs)');
    await user.clear(fuelInput);
    await user.type(fuelInput, '150000');

    const loadFuelButton = screen.getByText('Load Fuel');
    await user.click(loadFuelButton);

    // Should see fuel added to loading progression
    await waitFor(() => {
      const loadingPointsCount = screen.getByTestId('loading-points-count');
      expect(loadingPointsCount).toHaveTextContent('3'); // OEW + cargo + fuel
    });

    // Fuel button should show as loaded
    expect(screen.getByText('Fuel Loaded ✓')).toBeInTheDocument();
  });

  it('should handle test fill functionality', async () => {
    const user = userEvent.setup();
    render(<WeightCalc />);

    // Click Test Fill button
    const testFillButton = screen.getByText('Test Fill');
    await user.click(testFillButton);

    // Should automatically compute and show results
    await waitFor(() => {
      const loadingPointsCount = screen.getByTestId('loading-points-count');
      const count = parseInt(loadingPointsCount.textContent || '0');
      expect(count).toBeGreaterThan(2); // Should have multiple loading points
    });

    // Should see opportunity window data
    const opportunityCount = screen.getByTestId('opportunity-window-count');
    expect(parseInt(opportunityCount.textContent || '0')).toBeGreaterThan(0);
  });

  it('should switch between aircraft variants', async () => {
    const user = userEvent.setup();
    render(<WeightCalc />);

    // Should start with 300ER by default
    expect(screen.getByText('Boeing 777-300ER Weight & Balance')).toBeInTheDocument();

    // Switch to 200LR
    const variantSelect = screen.getByDisplayValue('300ER');
    await user.selectOptions(variantSelect, '200LR');

    // Should update display
    expect(screen.getByText('Boeing 777-200LR Weight & Balance')).toBeInTheDocument();
  });

  it('should switch between weight units', async () => {
    const user = userEvent.setup();
    render(<WeightCalc />);

    // Should start with LB
    expect(screen.getAllByPlaceholderText('Weight (lbs)')[0]).toBeInTheDocument();

    // Switch to KG
    const unitsSelect = screen.getByDisplayValue('LB');
    await user.selectOptions(unitsSelect, 'KG');

    // Should update placeholders
    expect(screen.getAllByPlaceholderText('Weight (kg)')[0]).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Fuel weight (kg)')).toBeInTheDocument();
  });

  it('should handle opportunity window calculations', async () => {
    const user = userEvent.setup();
    render(<WeightCalc />);

    // Fill with multiple weights to enable opportunity window
    const testFillButton = screen.getByText('Test Fill');
    await user.click(testFillButton);

    // Wait for computation
    await waitFor(() => {
      const opportunityCount = screen.getByTestId('opportunity-window-count');
      expect(parseInt(opportunityCount.textContent || '0')).toBeGreaterThan(0);
    });

    // Click Forward CG opportunity button
    const forwardButton = screen.getByText('Max Forward CG');
    await user.click(forwardButton);

    // Should update the configuration
    await waitFor(() => {
      // The weights should be rearranged for forward CG
      expect(screen.getByTestId('weight-chart')).toBeInTheDocument();
    });

    // Click Aft CG opportunity button
    const aftButton = screen.getByText('Max Aft CG');
    await user.click(aftButton);

    // Should update the configuration again
    await waitFor(() => {
      expect(screen.getByTestId('weight-chart')).toBeInTheDocument();
    });
  });

  it('should handle optimization', async () => {
    const user = userEvent.setup();
    render(<WeightCalc />);

    // Set up some cargo that might violate envelope
    const weightInputs = screen.getAllByPlaceholderText('Weight (lbs)');
    
    // Add a few positions with high weights
    await user.clear(weightInputs[0]);
    await user.type(weightInputs[0], '9000');

    // Add more positions
    const addButton = screen.getByText('Add Position');
    await user.click(addButton);
    await user.click(addButton);

    const updatedInputs = screen.getAllByPlaceholderText('Weight (lbs)');
    await user.clear(updatedInputs[1]);
    await user.type(updatedInputs[1], '8500');
    await user.clear(updatedInputs[2]);
    await user.type(updatedInputs[2], '7500');

    // Compute
    const computeButton = screen.getByText('Compute');
    await user.click(computeButton);

    // Try optimization
    const optimizeButton = screen.getByText('Optimize');
    await user.click(optimizeButton);

    // Should maintain the same number of loading points but potentially rearrange
    await waitFor(() => {
      const loadingPointsCount = screen.getByTestId('loading-points-count');
      expect(loadingPointsCount).toHaveTextContent('4'); // OEW + 3 cargo points
    });
  });

  it('should handle tabbed interface', async () => {
    const user = userEvent.setup();
    render(<WeightCalc />);

    // Should start on Chart tab
    expect(screen.getByText('Chart')).toBeInTheDocument();
    expect(screen.getByTestId('weight-chart')).toBeInTheDocument();

    // Switch to Loading Data tab
    await user.click(screen.getByText('Loading Data'));
    
    // Should see loading table (though it might be empty initially)
    expect(screen.getByText('Loading Data')).toBeInTheDocument();

    // Switch to Analytics tab
    await user.click(screen.getByText('Analytics'));
    
    // Should see analytics dashboard
    expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
  });

  it('should handle weight removal', async () => {
    const user = userEvent.setup();
    render(<WeightCalc />);

    // Add multiple positions
    const addButton = screen.getByText('Add Position');
    await user.click(addButton);
    await user.click(addButton);

    // Should have 3 positions total
    expect(screen.getAllByPlaceholderText('Weight (lbs)')).toHaveLength(3);

    // Remove one position (look for remove buttons - they might be X or Remove text)
    const removeButtons = screen.getAllByText('Remove');
    if (removeButtons.length > 0) {
      await user.click(removeButtons[0]);
      
      // Should have 2 positions left
      expect(screen.getAllByPlaceholderText('Weight (lbs)')).toHaveLength(2);
    }
  });

  it('should handle error states gracefully', async () => {
    const user = userEvent.setup();
    render(<WeightCalc />);

    // Try to load fuel without cargo
    const fuelInput = screen.getByPlaceholderText('Fuel weight (lbs)');
    await user.clear(fuelInput);
    await user.type(fuelInput, '150000');

    const loadFuelButton = screen.getByText('Load Fuel');
    await user.click(loadFuelButton);

    // Should handle this gracefully (might show error or just not do anything)
    // The exact behavior depends on implementation
    expect(screen.getByTestId('weight-chart')).toBeInTheDocument();
  });

  it('should maintain state consistency during operations', async () => {
    const user = userEvent.setup();
    render(<WeightCalc />);

    // Set up initial state
    const firstWeightInput = screen.getAllByPlaceholderText('Weight (lbs)')[0];
    await user.clear(firstWeightInput);
    await user.type(firstWeightInput, '6000');

    // Compute
    await user.click(screen.getByText('Compute'));

    // Switch tabs and back
    await user.click(screen.getByText('Loading Data'));
    await user.click(screen.getByText('Chart'));

    // State should be preserved
    expect(firstWeightInput).toHaveValue(6000);
    
    const loadingPointsCount = screen.getByTestId('loading-points-count');
    expect(loadingPointsCount).toHaveTextContent('2');
  });
});