// WisdomNET AGI Development System - Main Entry Point

import React from 'react';
import { WisdomNETProvider } from '@/contexts/WisdomNETContext';
import { WisdomNETDashboard } from '@/components/WisdomNET/Dashboard';

const Index = () => {
  return (
    <WisdomNETProvider>
      <WisdomNETDashboard />
    </WisdomNETProvider>
  );
};

export default Index;
