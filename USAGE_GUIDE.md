# 777 Weight & Balance Analytics System - Usage Guide

## Overview

The 777 Weight & Balance application now includes a comprehensive analytics and database system that tracks your optimization patterns, learns from your decisions, and helps you make data-driven cargo loading choices.

## 🆕 New Features

### 1. Pattern Database & Tracking
- **Automatic pattern saving** with performance metrics
- **Usage statistics** for all loading patterns
- **Success rate tracking** for different optimization methods
- **User rating system** (1-5 stars) for patterns

### 2. Optimization History
- **Complete tracking** of all optimization attempts
- **Performance comparison** between Basic, PSO, and ILP methods
- **Timing and success metrics** for each optimization
- **Envelope compliance monitoring**

### 3. Pattern Rankings
- **Intelligent scoring system** that ranks patterns based on:
  - Success rate (30%)
  - Usage frequency (20%)
  - CG optimization effectiveness (20%)
  - Speed of optimization (15%)
  - User ratings (15%)

### 4. Analytics Dashboard
- **Real-time insights** into your optimization patterns
- **Top performing patterns** with detailed metrics
- **Method effectiveness analysis**
- **Recent activity tracking**

---

## 📊 Using the Analytics Dashboard

### Accessing Analytics
1. Open the 777 Weight & Balance application
2. Click the **"Analytics"** tab in the main content area
3. View comprehensive performance data

### Dashboard Sections

#### Overview Cards
- **Total Patterns**: Number of patterns you've created/used
- **Total Optimizations**: Count of all optimization attempts
- **Success Rate**: Percentage of successful optimizations
- **Preferred Method**: Your most-used optimization algorithm

#### Top Performing Patterns
- View patterns ranked by overall performance score
- Click any pattern to see detailed metrics:
  - **Rank**: Current ranking position
  - **Score**: Composite performance score (0-100)
  - **Success Rate**: Percentage of successful optimizations
  - **Usage Count**: How many times you've used this pattern
  - **Average CG Position**: Typical center of gravity result
  - **Average Optimization Time**: Speed of optimization

#### Best Performing Pattern
- **Detailed view** of your highest-ranked pattern
- **Loading sequence** visualization
- **Performance metrics** and user rating
- **Usage statistics** and notes

#### Recent Activity
- **Timeline** of your latest optimizations
- **Success/failure indicators** with color coding
- **Method used** and performance metrics
- **Quick pattern identification**

---

## 🎯 Pattern Management

### Creating Custom Patterns
1. Go to **"Pattern Creator"** tab
2. Click **"Start Creating Pattern"**
3. **Name your pattern** (descriptive names work best)
4. **Select positions** in your preferred loading order
5. Click **"Save Pattern"**

**The system automatically:**
- Saves to local database
- Assigns initial 3-star rating
- Tags with "custom" and "user-created"
- Tracks usage from first use

### Rating Patterns
1. After using a pattern, rate its effectiveness
2. **5 stars**: Excellent performance, highly recommended
3. **4 stars**: Good performance, reliable
4. **3 stars**: Average performance, usable
5. **2 stars**: Below average, occasional issues
6. **1 star**: Poor performance, avoid

**Rating Impact:**
- Affects overall pattern score (15% weight)
- Influences pattern rankings
- Helps system recommend better patterns

---

## ⚡ Optimization Tracking

### How Tracking Works
Every time you run an optimization, the system automatically records:
- **Initial cargo configuration**
- **Final optimized arrangement**
- **Method used** (Basic, PSO, or ILP)
- **Performance metrics** (time, CG improvement, envelope compliance)
- **Success/failure status**

### Understanding Success Criteria

#### Basic Optimization
- **Success**: No major envelope violations (score < 1,000,000)
- **Tracks**: Random arrangement attempts and final CG position

#### PSO (Particle Swarm Optimization)
- **Success**: Fitness score < 1,000
- **Tracks**: Swarm performance and convergence

#### ILP (Integer Linear Programming)
- **Success**: Converged solution with objective value < 1,000
- **Tracks**: Mathematical optimization convergence

### Viewing Optimization History
1. Go to **Analytics** tab
2. Check **"Recent Activity"** section
3. **Green dot**: Successful optimization
4. **Red dot**: Failed optimization
5. **Method badges**: Show which algorithm was used

---

## 📈 Understanding Pattern Rankings

### Scoring System
Each pattern receives a composite score (0-100) based on:

#### Success Rate (30% weight)
- Percentage of optimizations that stay within flight envelope
- Higher success rate = higher score

#### Usage Count (20% weight)
- How frequently you use the pattern
- Popular patterns score higher (capped at 100 uses)

#### CG Optimization (20% weight)
- How well the pattern achieves optimal center of gravity
- Closer to 25% MAC is considered ideal

#### Speed (15% weight)
- How quickly optimizations complete
- Faster optimization = higher score

#### User Rating (15% weight)
- Your 1-5 star rating converted to 0-100 scale
- Direct user feedback on pattern quality

### Using Rankings for Decision Making

#### High-Ranked Patterns (Score 80-100)
- **Excellent choice** for most scenarios
- **Proven track record** of success
- **Fast optimization** times
- **High user satisfaction**

#### Medium-Ranked Patterns (Score 60-79)
- **Good general purpose** patterns
- **Reliable performance** in most cases
- **May have specific use cases** where they excel

#### Low-Ranked Patterns (Score <60)
- **Use with caution**
- **May work for specific scenarios**
- **Consider creating alternatives**

---

## 🛠️ Custom Pallet Positions

### Creating Custom Positions
1. Go to **"Custom Positions"** tab
2. Click **"Create Custom Position"**
3. Fill in the details:
   - **Position Code**: Unique identifier (e.g., "CP4", "CUSTOM1")
   - **Position Name**: Descriptive name (e.g., "Forward Cargo Bay 1")
   - **Moment Arm**: Distance in inches from reference point
   - **Pallet Type**: Select from Boeing standard types

### Benefits of Custom Positions
- **Specific aircraft configurations**
- **Non-standard cargo bay layouts**
- **Special loading requirements**
- **Custom moment arm calculations**

---

## 💡 Best Practices

### Pattern Creation
1. **Use descriptive names**: "Forward-Heavy-300ER" vs "Pattern1"
2. **Tag appropriately**: Include aircraft variant and loading strategy
3. **Document purpose**: Add notes about when to use the pattern
4. **Test thoroughly**: Try multiple optimization methods

### Optimization Strategy
1. **Start with Basic**: Quick first attempt to establish baseline
2. **Use PSO for complex scenarios**: Better for multiple constraints
3. **Try ILP for mathematical precision**: When exact solutions needed
4. **Compare methods**: Different algorithms may work better for different patterns

### Rating Guidelines
1. **Be honest**: Accurate ratings improve system recommendations
2. **Consider context**: Rate based on typical use cases
3. **Update ratings**: Reassess patterns as you gain experience
4. **Document issues**: Add notes explaining low ratings

### Analytics Usage
1. **Check regularly**: Monitor your optimization effectiveness
2. **Learn from top patterns**: Study what makes patterns successful
3. **Identify trends**: Look for patterns in your preferred methods
4. **Share insights**: Use data to improve team loading strategies

---

## 🔧 Troubleshooting

### Pattern Not Saving
- **Check name uniqueness**: Pattern names must be unique
- **Verify sequence**: Ensure at least one position is selected
- **Browser storage**: Clear browser cache if issues persist

### Analytics Not Loading
- **Refresh page**: Simple page refresh often resolves issues
- **Check console**: Open browser developer tools for error messages
- **Clear data**: Reset database if corruption is suspected

### Optimization Tracking Missing
- **Complete optimizations**: Partial runs may not be tracked
- **Check success criteria**: Failed optimizations still track with failure status
- **Database connectivity**: Ensure IndexedDB is available in browser

### Performance Issues
- **Large datasets**: System handles thousands of records efficiently
- **Browser limits**: IndexedDB has generous storage limits
- **Cleanup**: System automatically manages old data

---

## 📚 Advanced Usage

### Exporting Data
Currently, data is stored locally in IndexedDB. Future versions may include:
- **CSV export** for external analysis
- **Pattern sharing** between users
- **Backup/restore** functionality

### Integration Opportunities
The analytics system provides foundation for:
- **Machine learning** pattern recommendations
- **Automated optimization** selection
- **Team collaboration** features
- **Regulatory compliance** tracking

### API Access
The database system exposes hooks that could be used for:
- **Custom reporting** tools
- **Integration** with other systems
- **Automated testing** frameworks

---

## 🚀 Getting Started Checklist

1. ✅ **Create your first custom pattern**
2. ✅ **Run optimization using different methods**
3. ✅ **Rate your patterns** (1-5 stars)
4. ✅ **Check analytics dashboard** for insights
5. ✅ **Use rankings** to guide future decisions
6. ✅ **Monitor success rates** over time
7. ✅ **Experiment with custom positions** if needed

---

## 📞 Support

For questions about the analytics system:
1. **Check browser console** for error messages
2. **Review this guide** for usage instructions
3. **Test with simple patterns** to isolate issues
4. **Document specific scenarios** that cause problems

The analytics system is designed to learn from your usage patterns and improve your cargo loading efficiency over time. The more you use it, the better insights it provides for optimizing your 777 weight and balance operations.