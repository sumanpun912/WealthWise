
'use client';

// import { ForecastForm } from '@/components/forecast/ForecastForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter }from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/app/loading';
import { ForecastForm } from '@/components/forecast/ForecastForm';

export default function ForecastPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return <Loading />;
  }
  
  return (
    <div className="space-y-6">
      {/* Page title and description are handled within ForecastForm Card */}
      <ForecastForm />
    </div>
  );
}


// 'use client';

// import React, { useEffect } from 'react';
// import { ForecastForm } from '@/components/forecast/ForecastForm';
// import { useAuth } from '@/contexts/AuthContext';
// import { useRouter } from 'next/navigation';
// import Loading from '@/app/loading';

// export default function ForecastPage() {
//   const { currentUser, loading } = useAuth();
//   const router = useRouter();

//   // Redirect logic in effect (doesn't break hook order)
//   useEffect(() => {
//     if (!loading && !currentUser) {
//       router.push('/login');
//     }
//   }, [currentUser, loading, router]);

//   // Always render the same component tree
//   return (
//     <div className="space-y-6">
//       {loading ? (
//         <Loading />
//       ) : currentUser ? (
//         <ForecastForm />
//       ) : (
//         <div className="flex justify-center items-center h-40 text-muted-foreground">
//           Redirecting to login...
//         </div>
//       )}
//     </div>
//   );
// }

