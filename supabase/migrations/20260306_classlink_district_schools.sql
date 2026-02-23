-- Schools from counties/districts that use ClassLink (from public case studies and announcements)
-- Note: ClassLink does not publish a public database. This list is curated from ClassLink case studies,
-- district websites, and public sources. For a complete list, contact ClassLink or use a data vendor.

INSERT INTO public.schools (name, city, state, normalized_name, verified_domains)
VALUES
  -- Brevard County, FL (Brevard Public Schools - 80k+ users, ClassLink case study)
  ('Astronaut High School', 'Titusville', 'FL', 'astronaut high school', ARRAY['brevardschools.org']),
  ('Bayside High School', 'Palm Bay', 'FL', 'bayside high school', ARRAY['brevardschools.org']),
  ('Cocoa High School', 'Cocoa', 'FL', 'cocoa high school', ARRAY['brevardschools.org']),
  ('Cocoa Beach Junior/Senior High School', 'Cocoa Beach', 'FL', 'cocoa beach junior senior high school', ARRAY['brevardschools.org']),
  ('Eau Gallie High School', 'Melbourne', 'FL', 'eau gallie high school', ARRAY['brevardschools.org']),
  ('Heritage High School', 'Palm Bay', 'FL', 'heritage high school brevardschools', ARRAY['brevardschools.org']),
  ('Melbourne High School', 'Melbourne', 'FL', 'melbourne high school', ARRAY['brevardschools.org']),
  ('Merritt Island High School', 'Merritt Island', 'FL', 'merritt island high school', ARRAY['brevardschools.org']),
  ('Palm Bay High School', 'Palm Bay', 'FL', 'palm bay high school', ARRAY['brevardschools.org']),
  ('Rockledge High School', 'Rockledge', 'FL', 'rockledge high school', ARRAY['brevardschools.org']),
  ('Satellite High School', 'Satellite Beach', 'FL', 'satellite high school', ARRAY['brevardschools.org']),
  ('Space Coast Junior/Senior High School', 'Cocoa', 'FL', 'space coast junior senior high school', ARRAY['brevardschools.org']),
  ('Titusville High School', 'Titusville', 'FL', 'titusville high school', ARRAY['brevardschools.org']),
  ('Viera High School', 'Viera', 'FL', 'viera high school', ARRAY['brevardschools.org']),
  ('West Shore Junior/Senior High School', 'Melbourne', 'FL', 'west shore junior senior high school', ARRAY['brevardschools.org']),
  -- Clay County, FL (Clay County District Schools - ClassLink case study)
  ('Clay High School', 'Green Cove Springs', 'FL', 'clay high school green cove springs', ARRAY['oneclay.net', 'myoneclay.net']),
  ('Fleming Island High School', 'Orange Park', 'FL', 'fleming island high school', ARRAY['oneclay.net', 'myoneclay.net']),
  ('Middleburg High School', 'Middleburg', 'FL', 'middleburg high school', ARRAY['oneclay.net', 'myoneclay.net']),
  ('Oakleaf High School', 'Orange Park', 'FL', 'oakleaf high school', ARRAY['oneclay.net', 'myoneclay.net']),
  ('Orange Park High School', 'Orange Park', 'FL', 'orange park high school', ARRAY['oneclay.net', 'myoneclay.net']),
  ('Ridgeview High School', 'Orange Park', 'FL', 'ridgeview high school', ARRAY['oneclay.net', 'myoneclay.net']),
  ('Keystone Heights Junior/Senior High School', 'Keystone Heights', 'FL', 'keystone heights junior senior high school', ARRAY['oneclay.net', 'myoneclay.net']),
  -- Charlotte County, FL (Charlotte County Public Schools - ClassLink case study)
  ('Charlotte High School', 'Punta Gorda', 'FL', 'charlotte high school punta gorda', ARRAY['yourcharlotteschools.net']),
  ('Port Charlotte High School', 'Port Charlotte', 'FL', 'port charlotte high school', ARRAY['yourcharlotteschools.net']),
  ('Lemon Bay High School', 'Englewood', 'FL', 'lemon bay high school', ARRAY['yourcharlotteschools.net']),
  -- Bibb County, GA (Bibb County School District - ClassLink case study)
  ('Central High School', 'Macon', 'GA', 'central high school macon', ARRAY['bibb.k12.ga.us', 'bcsdk12.net']),
  ('Howard High School', 'Macon', 'GA', 'howard high school macon', ARRAY['bibb.k12.ga.us', 'bcsdk12.net']),
  ('Northeast High School', 'Macon', 'GA', 'northeast high school macon', ARRAY['bibb.k12.ga.us', 'bcsdk12.net']),
  ('Rutland High School', 'Macon', 'GA', 'rutland high school macon', ARRAY['bibb.k12.ga.us', 'bcsdk12.net']),
  ('Westside High School', 'Macon', 'GA', 'westside high school macon', ARRAY['bibb.k12.ga.us', 'bcsdk12.net']),
  -- Colonial School District, DE (ClassLink case study)
  ('William Penn High School', 'New Castle', 'DE', 'william penn high school new castle', ARRAY['colonial.k12.de.us']),
  ('Newark High School', 'Newark', 'DE', 'newark high school delaware', ARRAY['colonial.k12.de.us']),
  ('Glasgow High School', 'Newark', 'DE', 'glasgow high school delaware', ARRAY['colonial.k12.de.us']),
  -- Collierville Schools, TN (ClassLink case study)
  ('Collierville High School', 'Collierville', 'TN', 'collierville high school', ARRAY['colliervilleschools.org']),
  ('Collierville Middle School', 'Collierville', 'TN', 'collierville middle school', ARRAY['colliervilleschools.org']),
  -- Bryan ISD, TX (ClassLink case study)
  ('Bryan High School', 'Bryan', 'TX', 'bryan high school', ARRAY['bryanisd.org']),
  ('Rudder High School', 'Bryan', 'TX', 'rudder high school', ARRAY['bryanisd.org']),
  -- Boise School District, ID (ClassLink case study)
  ('Boise High School', 'Boise', 'ID', 'boise high school', ARRAY['boiseschools.org']),
  ('Borah High School', 'Boise', 'ID', 'borah high school', ARRAY['boiseschools.org']),
  ('Capital High School', 'Boise', 'ID', 'capital high school boise', ARRAY['boiseschools.org']),
  ('Timberline High School', 'Boise', 'ID', 'timberline high school boise', ARRAY['boiseschools.org']),
  -- Fairbanks North Star Borough, AK (ClassLink case study)
  ('Lathrop High School', 'Fairbanks', 'AK', 'lathrop high school', ARRAY['k12northstar.org']),
  ('West Valley High School', 'Fairbanks', 'AK', 'west valley high school fairbanks', ARRAY['k12northstar.org']),
  ('North Pole High School', 'North Pole', 'AK', 'north pole high school', ARRAY['k12northstar.org']),
  -- Rowan-Salisbury Schools, NC (ClassLink case study)
  ('Salisbury High School', 'Salisbury', 'NC', 'salisbury high school', ARRAY['rss.k12.nc.us']),
  ('East Rowan High School', 'Salisbury', 'NC', 'east rowan high school', ARRAY['rss.k12.nc.us']),
  ('West Rowan High School', 'Mt Ulla', 'NC', 'west rowan high school', ARRAY['rss.k12.nc.us']),
  ('South Rowan High School', 'China Grove', 'NC', 'south rowan high school', ARRAY['rss.k12.nc.us']),
  ('North Rowan High School', 'Spencer', 'NC', 'north rowan high school', ARRAY['rss.k12.nc.us']),
  -- Randolph Township Schools, NJ (ClassLink case study)
  ('Randolph High School', 'Randolph', 'NJ', 'randolph high school', ARRAY['rtmschools.org']),
  ('Randolph Middle School', 'Randolph', 'NJ', 'randolph middle school', ARRAY['rtmschools.org']),
  -- Elmwood Park Public Schools, NJ (ClassLink case study)
  ('Elmwood Park Memorial High School', 'Elmwood Park', 'NJ', 'elmwood park memorial high school', ARRAY['epps.org']),
  ('Elmwood Park Middle School', 'Elmwood Park', 'NJ', 'elmwood park middle school', ARRAY['epps.org']),
  -- Andover Public Schools, MA (ClassLink case study)
  ('Andover High School', 'Andover', 'MA', 'andover high school', ARRAY['aps1.net']),
  -- Clinton School District, MO (ClassLink case study)
  ('Clinton High School', 'Clinton', 'MO', 'clinton high school missouri', ARRAY['clintoncardinals.org']),
  -- Auburn School Department, ME (ClassLink case study)
  ('Edward Little High School', 'Auburn', 'ME', 'edward little high school', ARRAY['auburnschl.edu']),
  ('Auburn Middle School', 'Auburn', 'ME', 'auburn middle school', ARRAY['auburnschl.edu']),
  -- Harwood Unified Union School District, VT (ClassLink case study)
  ('Harwood Union High School', 'Moretown', 'VT', 'harwood union high school', ARRAY['huusd.org']),
  -- Sallisaw Public Schools, OK (ClassLink case study)
  ('Sallisaw High School', 'Sallisaw', 'OK', 'sallisaw high school', ARRAY['sallisawps.org']),
  -- Odyssey Charter School, DE (ClassLink case study)
  ('Odyssey Charter School', 'Wilmington', 'DE', 'odyssey charter school', ARRAY['odysseycharterschooldel.com']),
  -- Cleveland Public School District 391, MN (ClassLink case study)
  ('Cleveland Elementary School', 'Cleveland', 'MN', 'cleveland elementary school minnesota', ARRAY['isd391.org']),
  ('Cleveland Secondary School', 'Cleveland', 'MN', 'cleveland secondary school minnesota', ARRAY['isd391.org']);
