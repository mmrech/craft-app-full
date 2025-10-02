# Clinical Data Extraction System - Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### Issue: npm install fails with ENOTEMPTY error

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### Issue: npm install shows vulnerabilities

**Solution:**
The application has been tested with the current dependencies. Minor vulnerabilities are acceptable for development. If concerned:

```bash
npm audit fix
# Or for major updates (may cause breaking changes):
npm audit fix --force
```

### Environment Configuration

#### Issue: "Missing Supabase environment variables" in console

**Symptoms:**
- Error message in browser console
- App fails to connect to Supabase

**Solution:**
1. Verify `.env` file exists in project root
2. Check variable names match exactly:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```
3. Restart dev server after changing `.env`:
   ```bash
   # Stop server (Ctrl+C) then:
   npm run dev
   ```

#### Issue: Environment variables not loading

**Solution:**
- Vite requires `VITE_` prefix for client-side variables
- Variables without `VITE_` prefix won't be accessible
- Always restart dev server after env changes

### Supabase Connection Issues

#### Issue: "Failed to fetch" or network errors

**Symptoms:**
- Cannot upload PDFs
- Cannot save extractions
- Connection health checks fail

**Solutions:**

1. **Check Supabase URL:**
   ```bash
   # Test URL is accessible
   curl https://your-project.supabase.co
   ```

2. **Verify API key:**
   - Go to Supabase Dashboard > Settings > API
   - Copy the **anon/public** key (not the service_role key)
   - Update `.env` file

3. **Check internet connection:**
   - Supabase requires active internet
   - Check firewall/proxy settings

4. **Verify Supabase project status:**
   - Go to Supabase Dashboard
   - Check project is active (not paused)

#### Issue: "Storage bucket not found"

**Solution:**
1. Go to Supabase Dashboard > Storage
2. Create bucket named `pdf_documents`
3. Set as Private
4. Configure RLS policies:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Users can upload PDFs"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'pdf_documents');

   -- Allow users to read their own PDFs
   CREATE POLICY "Users can read their PDFs"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'pdf_documents' AND owner = auth.uid());
   ```

### PDF Upload Issues

#### Issue: PDF upload fails with "File too large"

**Solution:**
- Max file size: 50MB
- Compress PDF if larger:
  - Use online tools (e.g., ilovepdf.com)
  - Or use Adobe Acrobat compression
- Check storage bucket settings in Supabase

#### Issue: "This PDF is password-protected"

**Solution:**
- Remove password protection before upload
- Use PDF tools to unlock:
  - Adobe Acrobat
  - Online tools (ensure privacy)
  - Command line: `qpdf --decrypt input.pdf output.pdf`

#### Issue: PDF loads but text extraction fails

**Symptoms:**
- PDF displays correctly
- "Text extraction failed" error
- AI extraction doesn't work

**Solutions:**

1. **Scanned PDFs (Images):**
   - These require OCR (not currently supported)
   - Use online OCR tools first
   - Or convert to searchable PDF

2. **Corrupted PDF:**
   - Try opening in Adobe Reader
   - Re-save/export the PDF
   - Try different PDF source

3. **Network timeout during extraction:**
   - Wait and retry
   - Check network stability
   - Large PDFs may take longer

### Authentication Issues

#### Issue: Cannot sign up/sign in

**Solutions:**

1. **Check Supabase Auth settings:**
   - Go to Authentication > Settings
   - Verify email confirmation is configured
   - Check email provider settings

2. **Email not received:**
   - Check spam folder
   - Verify email in Supabase > Authentication > Users
   - Resend confirmation email

3. **"User already exists":**
   - Try password reset
   - Check if email is already registered

### Data Extraction Issues

#### Issue: Manual text selection doesn't work

**Symptoms:**
- Selected text doesn't populate field
- No highlight appears

**Solutions:**
1. Ensure a field is selected (highlighted in yellow)
2. Select text in PDF then release mouse
3. Check browser console for errors
4. Try refreshing page

#### Issue: AI extraction not working

**Symptoms:**
- Spinning icon indefinitely
- "AI extraction failed" error

**Solutions:**

1. **Check API key:**
   ```env
   LOVABLE_API_KEY=your-actual-key
   ```

2. **Check API rate limits:**
   - You may have exceeded quota
   - Wait and retry
   - Check Lovable dashboard

3. **Network issues:**
   - Verify internet connection
   - Check firewall settings
   - Try again in a few minutes

4. **PDF text not extracted:**
   - Ensure PDF text extraction completed
   - Check "Extracting text" progress bar finished
   - Reload PDF if needed

### Data Loss Issues

#### Issue: "Draft recovered" notification appears

**What it means:**
- Auto-save recovered unsaved work
- Data saved in browser localStorage
- Available for 24 hours

**Action:**
- Click "Restore" to recover data
- Or ignore to start fresh

#### Issue: Data not auto-saving

**Symptoms:**
- Changes lost on refresh
- No "Auto-saved" console message

**Solutions:**
1. Check browser console for errors
2. Verify localStorage is enabled:
   ```javascript
   // Test in browser console
   localStorage.setItem('test', 'value');
   console.log(localStorage.getItem('test'));
   ```
3. Clear browser storage and retry:
   - Browser DevTools > Application > Clear storage

#### Issue: "Storage quota exceeded"

**Solution:**
- Browser localStorage is full
- Clear old drafts:
  ```javascript
  // In browser console
  localStorage.clear();
  ```
- Or use browser's "Clear site data"

### Export Issues

#### Issue: Export fails or downloads empty file

**Solutions:**
1. Ensure data is entered in form fields
2. Check browser's download folder
3. Try different export format (CSV, Excel, JSON)
4. Check browser console for errors

### Performance Issues

#### Issue: App is slow or unresponsive

**Solutions:**

1. **Large PDF:**
   - Reduce PDF file size
   - Use lower zoom level
   - Close other browser tabs

2. **Memory issues:**
   - Refresh page
   - Clear browser cache
   - Restart browser

3. **Too many auto-saves:**
   - Auto-save debounces every 2 seconds
   - Normal behavior

### Database Issues

#### Issue: "Row Level Security policy violation"

**Symptoms:**
- Cannot save extractions
- "403 Forbidden" errors

**Solution:**
1. Verify you're logged in
2. Check RLS policies exist:
   - Go to Supabase > Database > Policies
   - Each table should have policies
3. Run migrations if missing:
   ```bash
   npx supabase db push
   ```

#### Issue: Migration errors

**Solution:**
```bash
# Reset and re-run migrations
npx supabase db reset
npx supabase db push
```

**Warning:** This will delete all data!

### Development Server Issues

#### Issue: Port 8080 already in use

**Solution:**
```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9
# Or use a different port
PORT=3000 npm run dev
```

#### Issue: Hot reload not working

**Solution:**
1. Restart dev server
2. Clear browser cache
3. Check Vite config is correct

### Build Issues

#### Issue: Production build fails

**Solution:**
```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

#### Issue: TypeScript errors during build

**Solution:**
- Fix type errors shown in output
- Or temporarily skip checks (not recommended):
  ```bash
  npm run build -- --mode production
  ```

## Getting Help

If issues persist:

1. **Check browser console:**
   - Press F12
   - Look for red errors
   - Note the error messages

2. **Check Supabase logs:**
   - Go to Project > Logs
   - Filter by error level
   - Check timestamps

3. **Review implementation plan:**
   - See [implementation_plan.md](../implementation_plan.md)
   - Check known issues section

4. **Environment details:**
   - Node version: `node --version`
   - npm version: `npm --version`
   - Browser and version

## Prevention Tips

1. **Regular backups:**
   - Export data frequently
   - Keep PDF originals safe

2. **Test in development:**
   - Don't make breaking changes in production
   - Test with sample PDFs first

3. **Monitor Supabase:**
   - Check project health regularly
   - Monitor storage usage
   - Watch for quota limits

4. **Keep dependencies updated:**
   ```bash
   npm outdated
   npm update
   ```

5. **Use version control:**
   - Commit working changes
   - Never commit `.env` files
   - Create branches for experiments
