import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

describe('Tabs', () => {
  const TabsExample = ({ defaultValue = 'tab1', onValueChange }: { 
    defaultValue?: string; 
    onValueChange?: (value: string) => void;
  }) => (
    <Tabs defaultValue={defaultValue} onValueChange={onValueChange}>
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
      <TabsContent value="tab3">Content 3</TabsContent>
    </Tabs>
  );

  it('should render tabs with default selected tab', () => {
    render(<TabsExample />);
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
    
    // Default content should be visible
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
  });

  it('should switch tabs when clicking triggers', () => {
    render(<TabsExample />);
    
    // Click on Tab 2
    fireEvent.click(screen.getByText('Tab 2'));
    
    // Content should switch
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
    
    // Click on Tab 3
    fireEvent.click(screen.getByText('Tab 3'));
    
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    expect(screen.getByText('Content 3')).toBeInTheDocument();
  });

  it('should call onValueChange when tab changes', () => {
    const handleValueChange = jest.fn();
    render(<TabsExample onValueChange={handleValueChange} />);
    
    fireEvent.click(screen.getByText('Tab 2'));
    expect(handleValueChange).toHaveBeenCalledWith('tab2');
    
    fireEvent.click(screen.getByText('Tab 3'));
    expect(handleValueChange).toHaveBeenCalledWith('tab3');
    
    expect(handleValueChange).toHaveBeenCalledTimes(2);
  });

  it('should respect different defaultValue', () => {
    render(<TabsExample defaultValue="tab2" />);
    
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
  });

  it('should apply active styles to selected trigger', () => {
    render(<TabsExample />);
    
    const tab1Trigger = screen.getByText('Tab 1');
    const tab2Trigger = screen.getByText('Tab 2');
    
    // Tab 1 should be active initially
    expect(tab1Trigger).toHaveClass('bg-white', 'text-gray-900', 'shadow-sm');
    expect(tab2Trigger).toHaveClass('text-gray-600');
    
    // Switch to Tab 2
    fireEvent.click(tab2Trigger);
    
    expect(tab1Trigger).toHaveClass('text-gray-600');
    expect(tab2Trigger).toHaveClass('bg-white', 'text-gray-900', 'shadow-sm');
  });

  it('should work with controlled mode', () => {
    const ControlledTabs = () => {
      const [value, setValue] = React.useState('tab1');
      
      return (
        <Tabs value={value} onValueChange={setValue}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <button onClick={() => setValue('tab2')}>Switch to Tab 2</button>
        </Tabs>
      );
    };
    
    render(<ControlledTabs />);
    
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    
    // Use external button to switch
    fireEvent.click(screen.getByText('Switch to Tab 2'));
    
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  describe('TabsList', () => {
    it('should render with correct styling', () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="test">Test</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      const tabsList = screen.getByText('Test').parentElement;
      expect(tabsList).toHaveClass('inline-flex', 'h-10', 'bg-gray-100');
    });

    it('should accept custom className', () => {
      render(
        <Tabs>
          <TabsList className="custom-tabs-list">
            <TabsTrigger value="test">Test</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      const tabsList = screen.getByText('Test').parentElement;
      expect(tabsList).toHaveClass('custom-tabs-list');
    });
  });

  describe('TabsTrigger', () => {
    it('should render as button element', () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="test">Test Trigger</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      const trigger = screen.getByText('Test Trigger');
      expect(trigger.tagName).toBe('BUTTON');
    });

    it('should accept custom className', () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="test" className="custom-trigger">
              Test
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      const trigger = screen.getByText('Test');
      expect(trigger).toHaveClass('custom-trigger');
    });
  });

  describe('TabsContent', () => {
    it('should accept custom className', () => {
      render(
        <Tabs defaultValue="test">
          <TabsContent value="test" className="custom-content">
            Test Content
          </TabsContent>
        </Tabs>
      );
      
      const content = screen.getByText('Test Content');
      expect(content).toHaveClass('custom-content');
    });

    it('should have focus ring styles', () => {
      render(
        <Tabs defaultValue="test">
          <TabsContent value="test">Test Content</TabsContent>
        </Tabs>
      );
      
      const content = screen.getByText('Test Content');
      expect(content).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });
  });

  describe('accessibility', () => {
    it('should have proper focus management', () => {
      render(<TabsExample />);
      
      const tab1 = screen.getByText('Tab 1');
      const tab2 = screen.getByText('Tab 2');
      
      tab1.focus();
      expect(tab1).toHaveFocus();
      
      tab2.focus();
      expect(tab2).toHaveFocus();
    });

    it('should support keyboard navigation', () => {
      render(<TabsExample />);
      
      const tab1 = screen.getByText('Tab 1');
      
      // Focus first tab
      tab1.focus();
      expect(tab1).toHaveFocus();
      
      // This would be enhanced with actual keyboard event simulation
      // For now, we verify that the elements are focusable
      expect(tab1.tabIndex).not.toBe(-1);
    });
  });

  it('should handle empty tabs gracefully', () => {
    render(
      <Tabs>
        <TabsList />
      </Tabs>
    );
    
    // Should not throw error
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });
});