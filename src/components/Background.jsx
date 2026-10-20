import React, { lazy, Suspense } from 'react';
import { getCapabilities } from '../hooks/useCapabilities';
import { useIntroDone } from '../lib/journey';
import SceneBoundary from './SceneBoundary';
import DataRain from './DataRain';

const SceneBackground = lazy(() => import('./three/SceneBackground'));

export default function Background() {
  const { enable3D } = getCapabilities();
  // The portal intro owns the GPU while it plays; the background wakes as it dissolves.
  const introDone = useIntroDone();

  return (
    <div aria-hidden="true">
      <div className="backdrop" />
      <div className="backdrop-grid" />
      {enable3D && introDone && <DataRain />}
      {enable3D && (
        <SceneBoundary>
          <Suspense fallback={null}>
            <SceneBackground paused={!introDone} />
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  );
}
