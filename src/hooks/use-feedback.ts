import axios from "@/lib/axios";

export function useFeedback() {
  const handleFeedbackSubmit = async (userPosition: string, feedbackText: string) => {
    try {
      const response = await axios.post('/api/feedback', { // Use axios.post
        userPosition,
        feedbackText
      });

      if (response.status === 200) { // Check status for success
        console.log('✅ Feedback submitted successfully:', response.data); // Access data from response.data
      } else {
        throw new Error(response.data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      throw error; // Re-throw to let the dialog handle the error
    }
  };

  return {
    handleFeedbackSubmit
  };
}