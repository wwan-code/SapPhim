/* Tệp: frontend/src/components/chat/AiMessageContent.jsx */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import { getImageUrl } from '../../utils/getAvatarUrl';

// Component Card Phim thu nhỏ cho Chat
const MovieChatCard = ({ movie, onTogglePopup }) => (
  <Link to={`/movie/${movie.slug}`} className="movie-chat-card" onClick={onTogglePopup}>
    <img src={getImageUrl(movie.posterUrl) || '/path/to/default-poster.png'} alt={movie.title} />
    <div className="movie-chat-info">
      <h4>{movie.title} ({movie.year})</h4>
      <p>{movie.description}</p>
    </div>
  </Link>
);

// Component render nội dung chính
const AiMessageContent = ({ message, onSuggestionClick, onTogglePopup }) => {
  const navigate = useNavigate();
  const { type, text, payload } = message;

  const handleNavigate = (route) => {
    navigate(route);
    // Có thể đóng popup chat tại đây nếu muốn
    onTogglePopup();
  };

  const renderPayload = () => {
    if (!payload) return null;

    switch (type) {
      case 'movie_list':
        return (
          <div className="ai-payload-container movie-list">
            {payload.map((movie, index) => (
              <MovieChatCard key={index} movie={movie} onTogglePopup={onTogglePopup} />
            ))}
          </div>
        );
      
      case 'movie_detail_text':
        // payload ở đây là 1 movie duy nhất
        return (
            <div className="ai-payload-container movie-detail">
                <MovieChatCard movie={payload} onTogglePopup={onTogglePopup} />
            </div>
        );

      case 'navigation':
        return (
          <div className="ai-payload-container navigation">
            <button 
              className="nav-button" 
              onClick={() => handleNavigate(payload.route)}
            >
              Đến trang {payload.routeName} <FaArrowRight />
            </button>
          </div>
        );

      case 'suggestions':
        return (
          <div className="ai-payload-container suggestions">
            {payload.map((suggestion, index) => (
              <button 
                key={index} 
                className="prompt-button"
                onClick={() => onSuggestionClick(suggestion.action_prompt)}
              >
                {suggestion.text}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="ai-message-content-wrapper">
      {/* Mô hình Markdown đơn giản để render text
        (Để an toàn, bạn nên dùng thư viện như 'react-markdown' và 'dompurify')
      */}
      <div 
        className="message-text" 
        dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} 
      />
      {renderPayload()}
    </div>
  );
};

export default AiMessageContent;