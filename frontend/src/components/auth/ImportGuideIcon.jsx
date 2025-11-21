import React from 'react';
import PropTypes from 'prop-types';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import CustomOverlayTrigger from '@/components/CustomTooltip/CustomOverlayTrigger';
import '@/assets/scss/components/auth/_import-guide-icon.scss';

const ImportGuideIcon = ({ onClick, modalId }) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <CustomOverlayTrigger
      tooltip="Hướng dẫn import"
      tooltipId="import-guide-tooltip"
      placement="top"
      trigger={['hover', 'focus']}
      delay={{ show: 200, hide: 0 }}
    >
      <button
        type="button"
        className="auth-popup__guide-icon"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label="Hướng dẫn import"
        aria-haspopup="dialog"
        aria-controls={modalId}
        tabIndex={0}
      >
        <AiOutlineQuestionCircle className="auth-popup__guide-icon-svg" />
      </button>
    </CustomOverlayTrigger>
  );
};

ImportGuideIcon.propTypes = {
  onClick: PropTypes.func.isRequired,
  modalId: PropTypes.string.isRequired,
};

export default ImportGuideIcon;
