import React from 'react';
import { useGetFavoritesQuery } from '../services/api';
import { Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import FavoriteButton from '../components/FavoriteButton';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const Favorites: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { data: favorites, isLoading, error } = useGetFavoritesQuery(undefined, {
    skip: !token,
  });

  if (!token) {
    return (
      <Container className="py-5">
        <Alert variant="info">
          <Alert.Heading>Please Log In</Alert.Heading>
          <p>You need to be logged in to view your favorites.</p>
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>Failed to load favorites. Please try again later.</p>
        </Alert>
      </Container>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h2>No Favorites Yet</h2>
          <p>Items you favorite will appear here.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">My Favorites</h1>
      <Row xs={1} md={2} lg={3} className="g-4">
        {favorites.map((item) => (
          <Col key={item.id}>
            <Card>
              {item.details?.images && item.details.images.length > 0 && (
                <Card.Img
                  variant="top"
                  src={item.details.images[0]}
                  alt={item.details?.title || `Item #${item.itemId}`}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
              )}
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <Link 
                    to={`/${item.itemType}s/${item.itemId}`} 
                    className="text-decoration-none text-dark"
                  >
                    <Card.Title>
                      {item.details?.title || `${item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)} #${item.itemId}`}
                    </Card.Title>
                  </Link>
                  <FavoriteButton itemId={item.itemId.toString()} itemType={item.itemType} />
                </div>
                {item.details?.price && (
                  <Card.Text className="fw-bold">
                    {item.details.price} AZN
                  </Card.Text>
                )}
                {item.details?.description && (
                  <Card.Text className="text-truncate">
                    {item.details.description}
                  </Card.Text>
                )}
                <Card.Text className="text-muted">
                  Added on: {new Date(item.createdAt).toLocaleDateString()}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Favorites; 