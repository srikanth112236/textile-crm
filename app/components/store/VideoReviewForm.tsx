import { useState } from 'react';

export function VideoReviewForm() {
  const [videoUrl, setVideoUrl] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && comment.trim() && videoUrl.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <h3 className="text-lg font-extrabold mb-4">Upload Your Video Review</h3>
      {submitted ? (
        <div className="text-green-600 font-bold">Thank you! Your video review has been submitted for moderation.</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="url"
            placeholder="Video URL (YouTube / Instagram)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
          <textarea
            placeholder="Write your review..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-xl ${rating >= star ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                aria-label={`${star} stars`}
              >
                ★
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="bg-slate-950 hover:bg-amber-500 hover:text-slate-950 text-white font-extrabold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            Submit Video Review
          </button>
        </form>
      )}
    </div>
  );
}
