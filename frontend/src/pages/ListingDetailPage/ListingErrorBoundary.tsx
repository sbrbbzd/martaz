import React from 'react';

class ListingErrorBoundary extends React.Component<
  { children: React.ReactNode }, 
  { hasError: boolean, error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    console.error("Error in listing detail page:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="listing-detail-page">
          <div className="listing-detail-page__container">
            <div className="listing-detail-page__error">
              <h2>Something went wrong</h2>
              <p>We're sorry, but there was an error loading this listing.</p>
              <div className="listing-detail-page__error-details">
                {this.state.error && (
                  <pre>{JSON.stringify(this.state.error, null, 2)}</pre>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ListingErrorBoundary; 