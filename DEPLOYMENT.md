# MERN Stack Quiz System - Production Deployment Checklist

## Pre-Deployment

### Backend
- [ ] Update JWT_SECRET in .env with a strong random key
- [ ] Set NODE_ENV=production
- [ ] Verify database backups are configured
- [ ] Test all API endpoints with production database
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure rate limiting appropriately
- [ ] Set up proper logging
- [ ] Configure email notifications (optional)
- [ ] Set appropriate CORS origins
- [ ] Test error handling and logging

### Frontend
- [ ] Update API_URL to production backend URL
- [ ] Run npm run build
- [ ] Test build locally
- [ ] Verify all environment variables
- [ ] Test all user flows
- [ ] Check mobile responsiveness
- [ ] Optimize images and assets
- [ ] Set up analytics (optional)

## Database

```sql
-- Create database and user
CREATE DATABASE quiz_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'quiz_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON quiz_system.* TO 'quiz_user'@'localhost';
FLUSH PRIVILEGES;

-- Create admin user
USE quiz_system;
INSERT INTO users (name, email, password, role, status) VALUES 
('Administrator', 'admin@yourdomain.com', '$2a$10/...bcrypt_hash...', 'admin', 'active');

-- Verify tables
SHOW TABLES;
```

## Deployment Commands

### Backend
```bash
# Install dependencies
npm install --production

# Run migrations
npm run migrate

# Start server
npm start
```

### Frontend
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Serve static files (use web server like nginx)
```

## Post-Deployment

- [ ] Verify backend health: GET /api/health
- [ ] Test authentication flow
- [ ] Test quiz creation and attempt
- [ ] Monitor error logs
- [ ] Set up automated backups
- [ ] Configure monitoring/alerting
- [ ] Test email notifications (if enabled)
- [ ] Document admin procedures
- [ ] Create backup of database

## Server Requirements

- Node.js v14+ (backend)
- MySQL 5.7+ (database)
- 2GB+ RAM
- Stable internet connection
- SSL certificate (for production)

## Security Checklist

- [ ] Enable HTTPS
- [ ] Configure firewall
- [ ] Set strong database password
- [ ] Enable database backups
- [ ] Use environment variables for secrets
- [ ] Keep dependencies updated
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use strong JWT secret
- [ ] Enable access logs
- [ ] Regular security audits

## Monitoring

- Monitor application logs
- Monitor database performance
- Monitor API response times
- Monitor error rates
- Set up alerts for critical issues
- Regular database backups (daily minimum)

## Maintenance

- Keep Node.js and dependencies updated
- Monitor and clean old logs
- Archive old quiz results periodically
- Regular security patches
- Performance optimization reviews

## Contact & Support

For production issues, contact the development team immediately.
