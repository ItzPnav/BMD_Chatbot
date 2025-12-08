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
import { adminAPI } from '../../services/api';
import styles from './AdminDashboard.module.css';

/**
 * Analytics Dashboard section component
 */
export const Analytics = () => {
  const [chatData, setChatData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [messageDistribution, setMessageDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = [
    'var(--tiffany-blue)',
    'var(--gamboge)',
    'var(--alloy-orange)',
    'var(--dark-cyan)',
    'var(--rufous)'
  ];

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch real analytics data from backend
      const analytics = await chatAPI.getAnalytics();
      
      if (analytics) {
        // Process sessions by date
        const now = new Date();
        const chatTimeSeries = [];
        const dateMap = new Map();
        
        // Initialize all 7 days with 0
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dateMap.set(date.toISOString().split('T')[0], { date: dateStr, chats: 0 });
        }
        
        // Fill in actual data
        analytics.sessionsByDate?.forEach(item => {
          // Handle date - could be string or Date object
          let dateKey;
          if (typeof item.date === 'string') {
            // PostgreSQL returns date as string like '2025-11-30'
            dateKey = item.date;
          } else {
            dateKey = new Date(item.date).toISOString().split('T')[0];
          }
          
          if (dateMap.has(dateKey)) {
            dateMap.get(dateKey).chats = parseInt(item.count) || 0;
          }
        });
        
        setChatData(Array.from(dateMap.values()));

        // Process messages by hour
        const hourMap = new Map();
        for (let h = 0; h < 24; h++) {
          hourMap.set(h, { hour: `${h.toString().padStart(2, '0')}:00`, messages: 0 });
        }
        
        analytics.messagesByHour?.forEach(item => {
          const hour = parseInt(item.hour);
          if (hourMap.has(hour)) {
            hourMap.get(hour).messages = parseInt(item.count) || 0;
          }
        });
        
        setActivityData(Array.from(hourMap.values()));

        // Process message distribution
        const userCount = analytics.messageDistribution?.find(m => m.role === 'user')?.count || 0;
        const assistantCount = analytics.messageDistribution?.find(m => m.role === 'assistant')?.count || 0;
        const total = userCount + assistantCount;
        
        if (total > 0) {
          setMessageDistribution([
            { name: 'User Messages', value: parseInt(userCount) },
            { name: 'Bot Responses', value: parseInt(assistantCount) }
          ]);
        } else {
          setMessageDistribution([
            { name: 'User Messages', value: 0 },
            { name: 'Bot Responses', value: 0 }
          ]);
        }
      } else {
        // Fallback to empty data if API fails
        setChatData([]);
        setActivityData([]);
        setMessageDistribution([]);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Use empty data on error
      setChatData([]);
      setActivityData([]);
      setMessageDistribution([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Analytics Dashboard</h2>
        <div className={styles.loading}>Loading analytics...</div>
      </div>
    );
  }

  const hasData = chatData.length > 0 || activityData.some(d => d.messages > 0) || messageDistribution.some(m => m.value > 0);

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Analytics Dashboard</h2>
      {!hasData && (
        <div className={styles.emptyState}>
          <p>No analytics data available yet. Start chatting to see statistics!</p>
        </div>
      )}
      {hasData && (
        <>
          <div className={styles.analyticsGrid}>
            <div className={styles.chartContainer}>
              <h3 className={styles.chartTitle}>Number of Chats (Time Series)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chatData}>
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
                    dataKey="chats"
                    stroke="var(--gamboge)"
                    strokeWidth={2}
                    name="Chats"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartContainer}>
              <h3 className={styles.chartTitle}>User Activity Timeline</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                  <XAxis dataKey="hour" stroke="var(--vanilla)" />
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
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartContainer}>
              <h3 className={styles.chartTitle}>Message Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={messageDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {messageDistribution.map((entry, index) => (
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
            </div>
          </div>
          <div className={styles.analyticsStats}>
            <div className={styles.statCard}>
              <h4>Total Sessions</h4>
              <p className={styles.statValue}>
                {chatData.reduce((sum, d) => sum + (d.chats || 0), 0)}
              </p>
            </div>
            <div className={styles.statCard}>
              <h4>Total Messages (24h)</h4>
              <p className={styles.statValue}>
                {activityData.reduce((sum, d) => sum + (d.messages || 0), 0)}
              </p>
            </div>
            <div className={styles.statCard}>
              <h4>User Messages</h4>
              <p className={styles.statValue}>
                {messageDistribution.find(m => m.name === 'User Messages')?.value || 0}
              </p>
            </div>
            <div className={styles.statCard}>
              <h4>Bot Responses</h4>
              <p className={styles.statValue}>
                {messageDistribution.find(m => m.name === 'Bot Responses')?.value || 0}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

