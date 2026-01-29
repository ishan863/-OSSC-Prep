import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Analytics Service - Tracks and analyzes user performance

// Helper to get local results
const getLocalResults = (userId) => {
  try {
    const results = JSON.parse(localStorage.getItem('ossc-practice-results') || '[]');
    return results.filter(r => r.userId === userId);
  } catch {
    return [];
  }
};

// Get overall user statistics
export const getUserStats = async (userId) => {
  try {
    // Try Firestore first
    let attempts = [];
    
    try {
      const attemptsQuery = query(
        collection(db, 'attempts'),
        where('userId', '==', userId)
      );
      
      const attemptsSnapshot = await getDocs(attemptsQuery);
      attempts = attemptsSnapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.warn('Firestore fetch failed, using local data:', e);
    }
    
    // Merge with local results
    const localResults = getLocalResults(userId);
    const allAttempts = [...attempts, ...localResults];
    
    // Remove duplicates by id
    const uniqueAttempts = allAttempts.reduce((acc, curr) => {
      if (!acc.find(a => a.id === curr.id || a.sessionId === curr.sessionId)) {
        acc.push(curr);
      }
      return acc;
    }, []);
    
    if (uniqueAttempts.length === 0) {
      return {
        totalAttempts: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        overallAccuracy: 0,
        totalTime: 0,
        averageScore: 0
      };
    }
    
    const stats = uniqueAttempts.reduce((acc, attempt) => ({
      totalAttempts: acc.totalAttempts + 1,
      totalQuestions: acc.totalQuestions + (attempt.totalQuestions || 0),
      correctAnswers: acc.correctAnswers + (attempt.correct || 0),
      wrongAnswers: acc.wrongAnswers + (attempt.wrong || 0),
      totalTime: acc.totalTime + (attempt.totalTime || 0),
      totalScore: acc.totalScore + (parseFloat(attempt.score) || 0)
    }), {
      totalAttempts: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalTime: 0,
      totalScore: 0
    });
    
    return {
      ...stats,
      overallAccuracy: stats.totalQuestions > 0 
        ? ((stats.correctAnswers / stats.totalQuestions) * 100).toFixed(2) 
        : 0,
      averageScore: stats.totalAttempts > 0 
        ? (stats.totalScore / stats.totalAttempts).toFixed(2) 
        : 0
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    // Return default stats on error
    return {
      totalAttempts: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      overallAccuracy: 0,
      totalTime: 0,
      averageScore: 0
    };
  }
};

// Get topic-wise performance
export const getTopicWisePerformance = async (userId) => {
  try {
    const attemptsQuery = query(
      collection(db, 'attempts'),
      where('userId', '==', userId)
    );
    
    const attemptsSnapshot = await getDocs(attemptsQuery);
    const topicStats = {};
    
    attemptsSnapshot.docs.forEach(doc => {
      const attempt = doc.data();
      const topicWise = attempt.topicWiseStats || {};
      
      Object.entries(topicWise).forEach(([topic, stats]) => {
        if (!topicStats[topic]) {
          topicStats[topic] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
        }
        topicStats[topic].total += stats.total || 0;
        topicStats[topic].correct += stats.correct || 0;
        topicStats[topic].wrong += stats.wrong || 0;
        topicStats[topic].skipped += stats.skipped || 0;
      });
    });
    
    // Calculate accuracy for each topic
    return Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      ...stats,
      accuracy: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(2) : 0
    })).sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));
  } catch (error) {
    console.error('Get topic-wise performance error:', error);
    throw error;
  }
};

// Get weak topics (topics with accuracy < 60%)
export const getWeakTopics = async (userId) => {
  const topicPerformance = await getTopicWisePerformance(userId);
  return topicPerformance.filter(topic => parseFloat(topic.accuracy) < 60);
};

// Get strong topics (topics with accuracy >= 80%)
export const getStrongTopics = async (userId) => {
  const topicPerformance = await getTopicWisePerformance(userId);
  return topicPerformance.filter(topic => parseFloat(topic.accuracy) >= 80);
};

// Get improvement trend (last 7 attempts)
export const getImprovementTrend = async (userId) => {
  try {
    const attemptsQuery = query(
      collection(db, 'attempts'),
      where('userId', '==', userId),
      orderBy('completedAt', 'desc'),
      firestoreLimit(7)
    );
    
    const attemptsSnapshot = await getDocs(attemptsQuery);
    
    return attemptsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        date: data.completedAt?.toDate?.() || new Date(data.endTime),
        accuracy: parseFloat(data.accuracy) || 0,
        score: parseFloat(data.score) || 0,
        type: data.type
      };
    }).reverse();
  } catch (error) {
    console.error('Get improvement trend error:', error);
    throw error;
  }
};

// Get daily activity (tests per day in last 30 days)
export const getDailyActivity = async (userId) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const attemptsQuery = query(
      collection(db, 'attempts'),
      where('userId', '==', userId)
    );
    
    const attemptsSnapshot = await getDocs(attemptsQuery);
    const dailyActivity = {};
    
    attemptsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = data.completedAt?.toDate?.() || new Date(data.endTime);
      
      if (date >= thirtyDaysAgo) {
        const dateKey = date.toISOString().split('T')[0];
        if (!dailyActivity[dateKey]) {
          dailyActivity[dateKey] = { tests: 0, questions: 0 };
        }
        dailyActivity[dateKey].tests += 1;
        dailyActivity[dateKey].questions += data.totalQuestions || 0;
      }
    });
    
    return dailyActivity;
  } catch (error) {
    console.error('Get daily activity error:', error);
    throw error;
  }
};

// Get subject-wise breakdown
export const getSubjectWiseBreakdown = async (userId) => {
  try {
    const wrongQuestionsQuery = query(
      collection(db, 'wrong_questions'),
      where('userId', '==', userId)
    );
    
    const wrongSnapshot = await getDocs(wrongQuestionsQuery);
    const subjectBreakdown = {};
    
    wrongSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const subject = data.subject || 'Unknown';
      
      if (!subjectBreakdown[subject]) {
        subjectBreakdown[subject] = { wrongCount: 0, revisited: 0 };
      }
      subjectBreakdown[subject].wrongCount += 1;
      if (data.revisited) {
        subjectBreakdown[subject].revisited += 1;
      }
    });
    
    return Object.entries(subjectBreakdown).map(([subject, data]) => ({
      subject,
      ...data,
      pending: data.wrongCount - data.revisited
    }));
  } catch (error) {
    console.error('Get subject-wise breakdown error:', error);
    throw error;
  }
};

// Get recommended focus areas
export const getRecommendations = async (userId) => {
  try {
    const weakTopics = await getWeakTopics(userId);
    const subjectBreakdown = await getSubjectWiseBreakdown(userId);
    
    const recommendations = [];
    
    // Recommend weak topics
    weakTopics.slice(0, 3).forEach(topic => {
      recommendations.push({
        type: 'weak_topic',
        priority: 'high',
        message: `Focus on ${topic.topic} - Current accuracy: ${topic.accuracy}%`,
        topic: topic.topic,
        accuracy: topic.accuracy
      });
    });
    
    // Recommend subjects with high wrong count
    subjectBreakdown
      .filter(s => s.pending > 5)
      .slice(0, 2)
      .forEach(subject => {
        recommendations.push({
          type: 'revision_needed',
          priority: 'medium',
          message: `Review ${subject.pending} wrong questions in ${subject.subject}`,
          subject: subject.subject,
          pendingCount: subject.pending
        });
      });
    
    return recommendations;
  } catch (error) {
    console.error('Get recommendations error:', error);
    return [];
  }
};

export default {
  getUserStats,
  getTopicWisePerformance,
  getWeakTopics,
  getStrongTopics,
  getImprovementTrend,
  getDailyActivity,
  getSubjectWiseBreakdown,
  getRecommendations
};
