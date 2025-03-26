import React from 'react';
import { useGetFavoritesQuery } from '../services/api';
import { Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import FavoriteButton from '../components/FavoriteButton';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const Favorites: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { data: favorites, isLoading, error } = useGetFavoritesQuery({
    page: 1,
    limit: 20
  }, {
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

  if (!favorites || !favorites.data || favorites.data.listings.length === 0) {
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
      <h1 className="mb-4">Your Favorites</h1>
      <Row>
        {favorites.data.listings.map((item) => (
          <Col md={4} key={item.id} className="mb-4">
            <Card>
              <Card.Img
                variant="top"
                src={item.featuredImage || '/placeholder.jpg'}
                alt={item.title}
              />
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <Card.Title>{item.title}</Card.Title>
                  <FavoriteButton
                    itemId={item.id}
                    itemType="listing"
                  />
                </div>
                <Card.Text>${item.price} {item.currency}</Card.Text>
                <Card.Text>{item.location}</Card.Text>
                <Link
                  to={`/listing/${item.slug}`}
                  className="btn btn-primary btn-sm"
                >
                  View Details
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Favorites; 