import React from 'react';

const FlagTableHeader = () => {
    return (
        <thead>
            <tr>
                <th style={{ width: '35%' }}>Flag</th>
                <th style={{ width: '12%' }}>Type</th>
                <th style={{ width: '20%' }}>Rollout</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '15%' }}>Updated</th>
                <th style={{ width: '8%' }}></th>
            </tr>
        </thead>
    );
};

export default FlagTableHeader;
