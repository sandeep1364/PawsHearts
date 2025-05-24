// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Rating,
  useTheme,
  // eslint-disable-next-line no-unused-vars
  FormControl
} from '@mui/material';
import {
  LocalHospital,
  Pets,
  Store,
  Home,
  School,
  LocationOn
} from '@mui/icons-material';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';

// Service type to color mapping for markers
const typeColors = {
  VETERINARY: '#FF5252',
  GROOMING: '#4B89F0',
  PET_STORE: '#4CAF50',
  ADOPTION_CENTER: '#FF9800',
  SHELTER: '#9C27B0',
  TRAINING: '#E91E63'
};

const serviceTypes = [
  { type: 'VETERINARY', label: 'Veterinary Hospitals', icon: <LocalHospital />, color: '#ff6b6b' },
  { type: 'GROOMING', label: 'Grooming Shops', icon: <Pets />, color: '#4dabf7' },
  { type: 'PET_STORE', label: 'Pet Stores', icon: <Store />, color: '#51cf66' },
  { type: 'ADOPTION_CENTER', label: 'Adoption Centers', icon: <Home />, color: '#ffd43b' },
  { type: 'SHELTER', label: 'Pet Shelters', icon: <Home />, color: '#be4bdb' },
  { type: 'TRAINING', label: 'Pet Training', icon: <School />, color: '#ff922b' }
];

const Services = () => {
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [viewport, setViewport] = useState({
    latitude: 37.7749,  // Default latitude (San Francisco)
    longitude: -122.4194, // Default longitude (San Francisco)
    zoom: 13
  });

  // Helper function to format address
  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    const { street, city, state, country, zipCode } = address;
    return `${street}, ${city}, ${state}, ${country} ${zipCode}`;
  };

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('Got user location:', location);
          setUserLocation(location);
          setViewport({
            latitude: location.lat,
            longitude: location.lng,
            zoom: 13
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Set default location to San Francisco if geolocation fails
          const defaultLocation = { lat: 37.7749, lng: -122.4194 };
          console.log('Using default location:', defaultLocation);
          setUserLocation(defaultLocation);
          setViewport({
            latitude: defaultLocation.lat,
            longitude: defaultLocation.lng,
            zoom: 13
          });
        }
      );
    }
  }, []);

  // Fetch default services on component mount
  useEffect(() => {
    if (userLocation) {
      // Fetch veterinary services by default when location is available
      fetchNearbyServices('VETERINARY');
    }
  }, [userLocation]);

  const fetchNearbyServices = async (type) => {
    if (!userLocation) {
      console.log('No user location available');
      return;
    }

    setLoading(true);
    setServices([]); // Clear previous services
    try {
      console.log('Fetching services with params:', {
        type,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radius: 45000
      });

      const response = await axios.get(`/api/services/nearby/${type}`, {
        params: {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radius: 45000 // 45km radius
        }
      });
      
      console.log('Fetched services:', response.data);
      
      if (response.data && response.data.length > 0) {
        console.log('First service coordinates:', response.data[0].location?.coordinates);
        setServices(response.data);
        setSelectedType(type);
        
        // Update viewport to center on first service
        if (response.data[0].location?.coordinates) {
          const [longitude, latitude] = response.data[0].location.coordinates;
          setViewport({
            ...viewport,
            latitude,
            longitude,
            zoom: 12
          });
        }
      } else {
        console.log('No services found for the selected type');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      alert(`Failed to fetch services: ${error.message}`);
    }
    setLoading(false);
  };

  const handleServiceClick = (service) => {
    console.log('Selected service:', service);
    console.log('Service coordinates:', service.location?.coordinates);
    setSelectedService(service);
    
    if (service.location?.coordinates && service.location.coordinates.length === 2) {
      const [longitude, latitude] = service.location.coordinates;
      console.log(`Setting viewport to longitude: ${longitude}, latitude: ${latitude}`);
      
      setViewport({
        ...viewport,
        longitude,
        latitude,
        zoom: 15 // Zoom in more to see the selected service
      });
    }
  };

  // Custom marker style based on service type
  const getMarkerStyle = (type) => ({
    backgroundColor: typeColors[type] || '#FF0000',
    width: 20,
    height: 20,
    borderRadius: '50%',
    cursor: 'pointer',
    border: '2px solid white',
    boxShadow: '0 0 5px rgba(0,0,0,0.3)'
  });

  return (
    <Box sx={{ 
      mt: '64px', // Height of navbar
      minHeight: 'calc(100vh - 64px)',
      backgroundColor: theme.palette.grey[50],
      pb: 4
    }}>
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          color: theme.palette.primary.main,
          fontWeight: 'bold',
          textAlign: 'center',
          mb: 4
        }}>
          Pet Services Near You
        </Typography>

        <Grid container spacing={3}>
          {/* Service Types List */}
          <Grid item xs={12} md={3}>
            <Paper elevation={3} sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              border: `1px solid ${theme.palette.grey[200]}`
            }}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: theme.palette.primary.main,
                color: 'white'
              }}>
                <Typography variant="h6">Services</Typography>
              </Box>
              <List>
                {serviceTypes.map((service) => (
                  <ListItem
                    button
                    key={service.type}
                    selected={selectedType === service.type}
                    onClick={() => fetchNearbyServices(service.type)}
                    sx={{
                      borderLeft: 4,
                      borderLeftColor: selectedType === service.type ? service.color : 'transparent',
                      '&:hover': {
                        backgroundColor: `${service.color}22`,
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: selectedType === service.type ? service.color : 'inherit'
                    }}>
                      {service.icon}
                    </ListItemIcon>
                    <ListItemText primary={service.label} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Map and Service Details */}
          <Grid item xs={12} md={9}>
            <Paper elevation={3} sx={{ 
              height: '70vh',
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
              border: `1px solid ${theme.palette.grey[200]}`
            }}>
              {loading ? (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <CircularProgress />
                  <Typography>Finding nearby services...</Typography>
                </Box>
              ) : (
                <Map
                  {...viewport}
                  style={{ height: '100%', width: '100%' }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  mapboxAccessToken="pk.eyJ1Ijoic3VubnktMTM2NCIsImEiOiJjbTlqZXE5ejQwYzB3MnFwb2JvdW83ZTMxIn0.I3vXr6kCRN5u9j9zosaElQ"
                  onMove={evt => setViewport(evt.viewState)}
                >
                  <NavigationControl position='top-right' />
                  
                  {services && services.length > 0 && services.map((service) => {
                    if (!service.location || !service.location.coordinates) {
                      console.warn('Service missing coordinates:', service);
                      return null;
                    }
                    
                    const [longitude, latitude] = service.location.coordinates;
                    console.log(`Rendering marker for ${service.name} at [${longitude}, ${latitude}]`);
                    
                    return (
                      <Marker
                        key={service._id}
                        longitude={longitude}
                        latitude={latitude}
                        onClick={e => {
                          e.originalEvent.stopPropagation();
                          handleServiceClick(service);
                        }}
                      >
                        <div 
                          style={getMarkerStyle(service.type)}
                          title={service.name}
                        />
                      </Marker>
                    );
                  })}
                </Map>
              )}
            </Paper>
          </Grid>

          {/* Service List */}
          {services.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Available {selectedType?.toLowerCase().replace('_', ' ')} services
              </Typography>
              <Grid container spacing={2}>
                {services.map((service) => (
                  <Grid item xs={12} sm={6} md={4} key={service._id}>
                    <Card sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {service.name}
                        </Typography>
                        <Typography color="textSecondary" gutterBottom sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <LocationOn fontSize="small" />
                          {formatAddress(service.address)}
                        </Typography>
                        <Rating value={service.rating} readOnly />
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {service.description}
                        </Typography>
                        <Box mt={2}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleServiceClick(service)}
                            fullWidth
                          >
                            View Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}
        </Grid>

        {/* Service Details Dialog */}
        <Dialog
          open={Boolean(selectedService)}
          onClose={() => setSelectedService(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          {selectedService && (
            <>
              <DialogTitle sx={{ 
                backgroundColor: theme.palette.primary.main,
                color: 'white'
              }}>
                {selectedService.name}
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography gutterBottom>
                      <strong>Address:</strong> {formatAddress(selectedService.address)}
                    </Typography>
                    <Typography gutterBottom>
                      <strong>Phone:</strong> {selectedService.phone}
                    </Typography>
                    {selectedService.website && (
                      <Typography gutterBottom>
                        <strong>Website:</strong>{' '}
                        <a href={selectedService.website} target="_blank" rel="noopener noreferrer">
                          {selectedService.website}
                        </a>
                      </Typography>
                    )}
                    <Box sx={{ mt: 1, mb: 2 }}>
                      <Typography component="span" sx={{ mr: 1 }}>
                        <strong>Rating:</strong>
                      </Typography>
                      <Rating value={selectedService.rating} readOnly />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Operating Hours
                    </Typography>
                    {Object.entries(selectedService.operatingHours || {}).map(([day, hours]) => (
                      <Typography key={day} sx={{ mb: 0.5 }}>
                        <strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong>{' '}
                        {hours.open} - {hours.close}
                      </Typography>
                    ))}
                  </Grid>
                </Grid>
              </DialogContent>
            </>
          )}
        </Dialog>
    </Container>
    </Box>
  );
};

export default Services; 