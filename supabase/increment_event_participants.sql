-- Function to increment event participants count
CREATE OR REPLACE FUNCTION increment_event_participants(event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_events 
  SET current_participants = current_participants + 1
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;
