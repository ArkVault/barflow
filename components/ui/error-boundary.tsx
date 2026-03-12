'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface Props {
     children: React.ReactNode;
     fallback?: React.ReactNode;
}

interface State {
     hasError: boolean;
     error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
     constructor(props: Props) {
          super(props);
          this.state = { hasError: false, error: null };
     }

     static getDerivedStateFromError(error: Error): State {
          return { hasError: true, error };
     }

     componentDidCatch(error: Error, info: React.ErrorInfo) {
          console.error('ErrorBoundary caught:', error, info.componentStack);
     }

     render() {
          if (this.state.hasError) {
               if (this.props.fallback) return this.props.fallback;

               return (
                    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                         <p className="text-sm text-muted-foreground">
                              Algo salió mal en esta sección.
                         </p>
                         <Button
                              variant="outline"
                              size="sm"
                              onClick={() => this.setState({ hasError: false, error: null })}
                         >
                              Reintentar
                         </Button>
                    </div>
               );
          }

          return this.props.children;
     }
}
