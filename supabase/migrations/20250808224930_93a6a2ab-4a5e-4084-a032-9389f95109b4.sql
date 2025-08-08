-- Add funnel_content column to services table
ALTER TABLE public.services 
ADD COLUMN funnel_content JSONB DEFAULT '{}'::jsonb;

-- Add index for better performance
CREATE INDEX idx_services_funnel_content ON public.services USING GIN(funnel_content);

-- Update RLS policy to allow funnel content updates
CREATE POLICY "Vendors can update their service funnel content" 
ON public.services 
FOR UPDATE 
USING (auth.uid() = vendor_id);

-- Update Tom Ferry service with custom HTML funnel
UPDATE public.services 
SET funnel_content = jsonb_build_object(
  'useCustomHtml', true,
  'customHtml', '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tom Ferry - Real Estate Coaching</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .hero { background: linear-gradient(135deg, #1e40af, #7c3aed); color: white; padding: 80px 20px; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 20px; }
        .hero p { font-size: 1.2rem; margin-bottom: 30px; }
        .cta-button { background: #ef4444; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 1.1rem; cursor: pointer; }
        .features { padding: 60px 20px; max-width: 1200px; margin: 0 auto; }
        .features h2 { text-align: center; margin-bottom: 40px; font-size: 2.5rem; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .feature { background: #f8fafc; padding: 30px; border-radius: 12px; text-align: center; }
        .testimonials { background: #1f2937; color: white; padding: 60px 20px; }
        .testimonial { max-width: 800px; margin: 0 auto; text-align: center; }
        .pricing { padding: 60px 20px; background: #f1f5f9; }
        .price-card { background: white; padding: 40px; border-radius: 12px; text-align: center; max-width: 400px; margin: 0 auto; }
        .price { font-size: 3rem; color: #1e40af; margin: 20px 0; }
        .footer { background: #111827; color: white; padding: 40px 20px; text-align: center; }
    </style>
</head>
<body>
    <section class="hero">
        <h1>Transform Your Real Estate Business</h1>
        <p>Join thousands of agents who have doubled their income with Tom Ferry''s proven coaching system</p>
        <button class="cta-button" onclick="alert(''Ready to transform your business!'')">Get Started Today</button>
    </section>

    <section class="features">
        <h2>What You''ll Get</h2>
        <div class="feature-grid">
            <div class="feature">
                <h3>🎯 1-on-1 Coaching</h3>
                <p>Personal coaching sessions tailored to your specific goals and challenges</p>
            </div>
            <div class="feature">
                <h3>📈 Lead Generation</h3>
                <p>Proven systems to generate consistent, high-quality leads</p>
            </div>
            <div class="feature">
                <h3>💼 Business Systems</h3>
                <p>Complete business frameworks that scale with your growth</p>
            </div>
        </div>
    </section>

    <section class="testimonials">
        <div class="testimonial">
            <h2>"Increased my sales by 300% in just 6 months!"</h2>
            <p>- Sarah Johnson, Top Producer</p>
        </div>
    </section>

    <section class="pricing">
        <div class="price-card">
            <h2>Elite Coaching Program</h2>
            <div class="price">$2,997</div>
            <p>Complete transformation package</p>
            <button class="cta-button" onclick="alert(''Let\''s get started!'')">Join Now</button>
        </div>
    </section>

    <footer class="footer">
        <p>&copy; 2024 Tom Ferry International. All rights reserved.</p>
    </footer>
</body>
</html>'
)
WHERE title ILIKE '%tom ferry%' OR title ILIKE '%ferry%';