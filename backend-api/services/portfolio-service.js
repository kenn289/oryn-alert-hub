/**
 * Portfolio Service for Backend API
 * Manages user portfolios and investments
 */

class PortfolioService {
    constructor() {
        this.STORAGE_KEY = 'oryn_portfolio';
    }

    /**
     * Get user's portfolio
     */
    async getPortfolio(userId) {
        try {
            // In a real implementation, this would fetch from database
            // For now, we'll return mock portfolio data
            const portfolio = [
                {
                    id: '1',
                    ticker: 'AAPL',
                    name: 'Apple Inc.',
                    shares: 10,
                    avgPrice: 150.00,
                    currentPrice: 175.50,
                    totalValue: 1755.00,
                    gainLoss: 255.00,
                    gainLossPercent: 17.0,
                    market: 'US',
                    currency: 'USD',
                    exchange: 'NASDAQ',
                    addedAt: new Date().toISOString()
                },
                {
                    id: '2',
                    ticker: 'GOOGL',
                    name: 'Alphabet Inc.',
                    shares: 5,
                    avgPrice: 2800.00,
                    currentPrice: 2950.00,
                    totalValue: 14750.00,
                    gainLoss: 750.00,
                    gainLossPercent: 5.36,
                    market: 'US',
                    currency: 'USD',
                    exchange: 'NASDAQ',
                    addedAt: new Date().toISOString()
                }
            ];

            return portfolio;
        } catch (error) {
            console.error('Error fetching portfolio:', error);
            throw error;
        }
    }

    /**
     * Add stock to portfolio
     */
    async addToPortfolio(userId, stockData) {
        try {
            const { ticker, shares, avgPrice, name, market, currency, exchange } = stockData;
            
            const portfolioItem = {
                id: Date.now().toString(),
                ticker: ticker.toUpperCase(),
                name: name || `${ticker} Inc.`,
                shares: parseFloat(shares),
                avgPrice: parseFloat(avgPrice),
                currentPrice: parseFloat(avgPrice), // Will be updated with real price
                totalValue: parseFloat(shares) * parseFloat(avgPrice),
                gainLoss: 0,
                gainLossPercent: 0,
                market: market || 'US',
                currency: currency || 'USD',
                exchange: exchange || 'NASDAQ',
                addedAt: new Date().toISOString()
            };

            // In a real implementation, this would save to database
            console.log('Portfolio item added:', portfolioItem);
            
            return portfolioItem;
        } catch (error) {
            console.error('Error adding to portfolio:', error);
            throw error;
        }
    }

    /**
     * Update portfolio item
     */
    async updatePortfolioItem(userId, itemId, updates) {
        try {
            // In a real implementation, this would update in database
            console.log('Portfolio item updated:', { itemId, updates });
            
            return { success: true, message: 'Portfolio item updated successfully' };
        } catch (error) {
            console.error('Error updating portfolio item:', error);
            throw error;
        }
    }

    /**
     * Remove from portfolio
     */
    async removeFromPortfolio(userId, itemId) {
        try {
            // In a real implementation, this would remove from database
            console.log('Portfolio item removed:', { itemId });
            
            return { success: true, message: 'Portfolio item removed successfully' };
        } catch (error) {
            console.error('Error removing from portfolio:', error);
            throw error;
        }
    }

    /**
     * Get portfolio summary
     */
    async getPortfolioSummary(userId) {
        try {
            const portfolio = await this.getPortfolio(userId);
            
            const totalValue = portfolio.reduce((sum, item) => sum + item.totalValue, 0);
            const totalInvested = portfolio.reduce((sum, item) => sum + (item.shares * item.avgPrice), 0);
            const totalGainLoss = totalValue - totalInvested;
            const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
            
            return {
                totalValue,
                totalGainLoss,
                totalGainLossPercent,
                totalInvested,
                dayChange: totalGainLoss * 0.1, // Simulated day change
                dayChangePercent: totalGainLossPercent * 0.1,
                itemCount: portfolio.length
            };
        } catch (error) {
            console.error('Error getting portfolio summary:', error);
            throw error;
        }
    }
}

module.exports = PortfolioService;
