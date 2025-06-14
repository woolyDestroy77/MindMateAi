import React from 'react';

interface DappierWidgetProps {
  className?: string;
}

const DappierWidget: React.FC<DappierWidgetProps> = ({ className = '' }) => {
  return (
    <div id="dappier-ask-ai-widget" className={className}>
      <dappier-ask-ai-widget 
        widgetId="wd_01jxpzftx6e3ntsgzwtgbze71c" 
      />
    </div>
  );
};

export default DappierWidget;