import React, { lazy, Suspense } from 'react';
import { getCapabilities } from '../hooks/useCapabilities';
import SceneBoundary from './SceneBoundary';

const SceneBackground = lazy(() => import('./three/SceneBackground'));

export default function Background() {
  const { enable3D } = getCapabilities();

  return (
    <div aria-hidden="true">
      <div className="backdrop" />
      <div className="backdrop-grid" />
      {enable3D && (
        <SceneBoundary>
          <Suspense fallback={null}>
            <SceneBackground />
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  );
}
