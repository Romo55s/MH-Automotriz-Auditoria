import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../common/display';

interface MonthlyInventoryHeaderProps {
  agencyName: string;
  subtitle: string;
}

const MonthlyInventoryHeader: React.FC<MonthlyInventoryHeaderProps> = ({
  agencyName,
  subtitle
}) => {
  const navigate = useNavigate();

  return (
    <div className='mt-6 sm:mt-8 mb-6 sm:mb-section'>
      <Header
        title='MH Automotriz'
        subtitle={`${agencyName} - ${subtitle}`}
        showBackButton={true}
        onBackClick={() => navigate('/')}
        showUserInfo={true}
      />
    </div>
  );
};

export default MonthlyInventoryHeader;
