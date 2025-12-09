import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { adminAPI, chatAPI } from '../../services/api';
import styles from './AdminDashboard.module.css';

/**
 * Comprehensive Analytics Dashboard component
 */
export const Analytics = () => {
  const [overviewStats, setOverviewStats] = useState({
    totalChats: 0,
    userMessages: 0,
    activeDocuments: 0,
    satisfactionRate: 0,
    positiveFeedback: 0,
    negativeFeedback: 0
  });
  
  const [queryTrendData, setQueryTrendData] = useState([]);
  const [feedbackData, setFeedbackData] = useState({
    distribution: [],
    satisfactionRate: 0,
    totalFeedback: 0
  });
  const [responseTimeData, setResponseTimeData] = useState({
    avgResponseTime: 0,
    medianResponseTime: 0,
    p95ResponseTime: 0,
    maxResponseTime: 0,
    searchTime: 0,
    llmTime: 0,
    sampleSize: 0
  });
  const [topQueries, setTopQueries] = useState([]);
  const [activityByHour, setActivityByHour] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    totalChunks: 0,
    apiEndpoints: 0,
    analyticsPeriod: '7 days'
  });
  
  const [dateRange, setDateRange] = useState('7');
  const [loading, setLoading] = useState(true);

  const COLORS = [
    '#0dd9ff',
    '#ffb81c',
    '#ff6b5a',
    '#00d4aa',
    '#a64dff'
  ];

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const analytics = await chatAPI.getAnalytics();
      
      if (analytics) {
        processOverviewStats(analytics);
        processQueryTrends(analytics);
        processFeedbackData(analytics);
        processResponseTimes(analytics);
        processTopQueries(analytics);
        processActivityByHour(analytics);
        processSystemStatus(analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processOverviewStats = (analytics) => {
    const userMessages = analytics.messageDistribution?.find(m => m.role === 'user')?.count || 0;
    const totalChats = analytics.sessionsByDate?.reduce((sum, item) => sum + parseInt(item.count || 0), 0) || 0;
    const likes = analytics.feedbackDistribution?.find(f => f.rating_type === 'like')?.count || 0;
    const dislikes = analytics.feedbackDistribution?.find(f => f.rating_type === 'dislike')?.count || 0;
    const totalFeedback = likes + dislikes;
    const satisfactionRate = totalFeedback > 0 ? Math.round((likes / totalFeedback) * 100) : 0;

    setOverviewStats({
      totalChats,
      userMessages: parseInt(userMessages),
      activeDocuments: analytics.activeDocuments || 0,
      satisfactionRate,
      positiveFeedback: parseInt(likes),
      negativeFeedback: parseInt(dislikes)
    });
  };

  const processQueryTrends = (analytics) => {
    const now = new Date();
    const days = parseInt(dateRange);
    const dateMap = new Map();

    // Initialize dates
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap.set(date.toISOString().split('T')[0], { date: dateStr, queries: 0 });
    }

    // Fill in actual data
    if (analytics.sessionsByDate && Array.isArray(analytics.sessionsByDate)) {
      analytics.sessionsByDate.forEach(item => {
        let dateKey = typeof item.date === 'string' ? item.date : new Date(item.date).toISOString().split('T')[0];
        if (dateMap.has(dateKey)) {
          dateMap.get(dateKey).queries = parseInt(item.count) || 0;
        }
      });
    }

    setQueryTrendData(Array.from(dateMap.values()));
  };

  const processFeedbackData = (analytics) => {
    let likes = 0;
    let dislikes = 0;

    if (analytics.feedbackDistribution && Array.isArray(analytics.feedbackDistribution)) {
      likes = analytics.feedbackDistribution.find(f => f.rating_type === 'like')?.count || 0;
      dislikes = analytics.feedbackDistribution.find(f => f.rating_type === 'dislike')?.count || 0;
    }

    const totalFeedback = parseInt(likes) + parseInt(dislikes);
    const satisfactionRate = totalFeedback > 0 ? Math.round((parseInt(likes) / totalFeedback) * 100) : 0;

    setFeedbackData({
      distribution: [
        { name: 'Positive 👍', value: parseInt(likes) },
        { name: 'Negative 👎', value: parseInt(dislikes) }
      ],
      satisfactionRate,
      totalFeedback
    });
  };

  const processResponseTimes = (analytics) => {
    let responseTimes = {};
    
    // Handle different possible data structures from backend
    if (analytics.responseTimes) {
      responseTimes = analytics.responseTimes;
    } else if (analytics.messageMetrics) {
      responseTimes = {
        avg: analytics.messageMetrics.avgResponseTime,
        median: analytics.messageMetrics.medianResponseTime,
        p95: analytics.messageMetrics.p95ResponseTime,
        max: analytics.messageMetrics.maxResponseTime,
        searchTime: analytics.messageMetrics.searchTime,
        llmTime: analytics.messageMetrics.llmTime,
        sampleSize: analytics.messageMetrics.sampleSize
      };
    }

    setResponseTimeData({
      avgResponseTime: Math.round(responseTimes.avg || 0),
      medianResponseTime: Math.round(responseTimes.median || 0),
      p95ResponseTime: Math.round(responseTimes.p95 || 0),
      maxResponseTime: Math.round(responseTimes.max || 0),
      searchTime: Math.round(responseTimes.searchTime || 0),
      llmTime: Math.round(responseTimes.llmTime || 0),
      sampleSize: responseTimes.sampleSize || 0
    });
  };

  const processTopQueries = (analytics) => {
    const queries = analytics.topQueries || [];
    setTopQueries(queries.slice(0, 10));
  };

  const processActivityByHour = (analytics) => {
    const hourMap = new Map();
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, { hour: `${h.toString().padStart(2, '0')}:00`, messages: 0, chats: 0 });
    }

    if (analytics.messagesByHour && Array.isArray(analytics.messagesByHour)) {
      analytics.messagesByHour.forEach(item => {
        const hour = parseInt(item.hour);
        if (hourMap.has(hour)) {
          hourMap.get(hour).messages = parseInt(item.count) || 0;
        }
      });
    }

    if (analytics.chatsByHour && Array.isArray(analytics.chatsByHour)) {
      analytics.chatsByHour.forEach(item => {
        const hour = parseInt(item.hour);
        if (hourMap.has(hour)) {
          hourMap.get(hour).chats = parseInt(item.count) || 0;
        }
      });
    }

    setActivityByHour(Array.from(hourMap.values()));
  };

  const processSystemStatus = (analytics) => {
    setSystemStatus({
      totalChunks: analytics.totalChunks || 0,
      apiEndpoints: analytics.apiEndpoints || 1,
      analyticsPeriod: `${dateRange} days`
    });
  };

  if (loading) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Analytics Dashboard</h2>
        <div className={styles.loading}>Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.analyticsHeader}>
        <h2 className={styles.sectionTitle}>Analytics Dashboard</h2>
        <div className={styles.dateRangeSelector}>
          <label>Period:</label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className={styles.dateRangeSelect}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h4>Total Chats</h4>
          <p className={styles.statValue}>{overviewStats.totalChats}</p>
        </div>
        <div className={styles.statCard}>
          <h4>User Messages</h4>
          <p className={styles.statValue}>{overviewStats.userMessages}</p>
        </div>
        <div className={styles.statCard}>
          <h4>Active Documents</h4>
          <p className={styles.statValue}>{overviewStats.activeDocuments}</p>
        </div>
        <div className={styles.statCard}>
          <h4>Satisfaction Rate</h4>
          <p className={styles.statValue}>{overviewStats.satisfactionRate}%</p>
        </div>
        <div className={styles.statCard}>
          <h4>👍 Positive Feedback</h4>
          <p className={styles.statValue}>{overviewStats.positiveFeedback}</p>
        </div>
        <div className={styles.statCard}>
          <h4>👎 Negative Feedback</h4>
          <p className={styles.statValue}>{overviewStats.negativeFeedback}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Query Trends */}
        <div className={styles.chartWrapper}>
          <h3 className={styles.chartTitle}>Query Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={queryTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
              <XAxis dataKey="date" stroke="var(--vanilla)" />
              <YAxis stroke="var(--vanilla)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--vanilla)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="queries"
                stroke="var(--gamboge)"
                strokeWidth={2}
                name="Daily Queries"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Feedback Distribution */}
        <div className={styles.chartWrapper}>
          <h3 className={styles.chartTitle}>User Feedback Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={feedbackData.distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {feedbackData.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--vanilla)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.feedbackStats}>
            <p>Satisfaction Rate: <strong>{feedbackData.satisfactionRate}%</strong></p>
            <p>Total Feedback: <strong>{feedbackData.totalFeedback}</strong></p>
          </div>
        </div>

        {/* Chat Activity by Hour */}
        <div className={styles.chartWrapper}>
          <h3 className={styles.chartTitle}>Chat Activity by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
              <XAxis dataKey="hour" stroke="var(--vanilla)" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="var(--vanilla)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--vanilla)'
                }}
              />
              <Legend />
              <Bar dataKey="messages" fill="var(--tiffany-blue)" name="Messages" />
              <Bar dataKey="chats" fill="var(--gamboge)" name="Chats" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Response Time Performance */}
      <div className={styles.performanceSection}>
        <h3 className={styles.chartTitle}>Response Time Performance (ms)</h3>
        <div className={styles.performanceGrid}>
          <div className={styles.performanceCard}>
            <h5>Average</h5>
            <p className={styles.performanceValue}>{responseTimeData.avgResponseTime}</p>
            <span>ms</span>
          </div>
          <div className={styles.performanceCard}>
            <h5>Median</h5>
            <p className={styles.performanceValue}>{responseTimeData.medianResponseTime}</p>
            <span>ms</span>
          </div>
          <div className={styles.performanceCard}>
            <h5>P95</h5>
            <p className={styles.performanceValue}>{responseTimeData.p95ResponseTime}</p>
            <span>ms</span>
          </div>
          <div className={styles.performanceCard}>
            <h5>Max</h5>
            <p className={styles.performanceValue}>{responseTimeData.maxResponseTime}</p>
            <span>ms</span>
          </div>
          <div className={styles.performanceCard}>
            <h5>Search Time</h5>
            <p className={styles.performanceValue}>{responseTimeData.searchTime}</p>
            <span>ms</span>
          </div>
          <div className={styles.performanceCard}>
            <h5>LLM Time</h5>
            <p className={styles.performanceValue}>{responseTimeData.llmTime}</p>
            <span>ms</span>
          </div>
        </div>
        <p className={styles.sampleSize}>Sample Size: {responseTimeData.sampleSize} queries</p>
      </div>

      {/* Top 10 Queries */}
      {topQueries.length > 0 && (
        <div className={styles.topQueriesSection}>
          <h3 className={styles.chartTitle}>Top 10 Most Frequent Queries</h3>
          <div className={styles.queriesList}>
            {topQueries.map((query, index) => (
              <div key={index} className={styles.queryItem}>
                <span className={styles.queryRank}>#{index + 1}</span>
                <span className={styles.queryText}>{query.query}</span>
                <span className={styles.queryCount}>{query.count} times</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status */}
      <div className={styles.systemStatus}>
        <h3 className={styles.chartTitle}>System Status</h3>
        <div className={styles.statusGrid}>
          <div className={styles.statusCard}>
            <h5>Total Chunks Indexed</h5>
            <p className={styles.statusValue}>{systemStatus.totalChunks}</p>
          </div>
          <div className={styles.statusCard}>
            <h5>API Endpoints</h5>
            <p className={styles.statusValue}>{systemStatus.apiEndpoints}</p>
          </div>
          <div className={styles.statusCard}>
            <h5>Analytics Period</h5>
            <p className={styles.statusValue}>{systemStatus.analyticsPeriod}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
