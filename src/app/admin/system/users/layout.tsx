'use client';

import React, { use } from 'react';

export default function UsersLayout(props: { 
  children: React.ReactNode;
  params: Promise<any>;
}) {
  // Properly unwrap params with use() if they exist
  if (props.params) {
    use(props.params);
  }

  return (
    <div>
      {props.children}
    </div>
  );
}
