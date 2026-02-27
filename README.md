<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>

  <h1>MyFoodDesk: A Web-Based Home Food Business Management &amp; Sales Analytics Platform</h1>
  <p><strong>Overview</strong><br>
  <ul>
    <li>Project Title</li>
    <li>Team Members</li>
    <li>Problem Statement & Motivation</li>
    <li>Project Scope & Features</li>
    <li>Data Models</li>
    <li>Technology Stack</li>
  </ul>

  <hr/>

  <p><strong>1. Project Title</strong><br>
    MyFoodDesk: A Web-Based Home Food Business Management &amp; Sales Analytics Platform<br>
    Project Type: Web Application
  </p>

  <hr/>

  <p><strong>2. Team Members</strong><br>
    Hein Thit Swan (6715181)
  </p>

  <hr/>

  <p><strong>3. Problem Statement &amp; Motivation</strong><br>
    Small home-based food sellers often manage their operations manually using notebooks or spreadsheets,
    making it difficult to accurately track orders, delivery fees, product costs, and profits. There is usually no
    structured system to monitor sales performance or identify best-selling products.
  </p>

  <p>Additionally, many sellers face challenges in:</p>
  <p>
    &#9679; Managing bulk orders efficiently<br>
    &#9679; Applying discount rules consistently<br>
    &#9679; Planning production for large-quantity orders<br>
    &#9679; Handling pre-scheduled orders
  </p>

  <p>
    This system aims to provide a centralized web-based platform to streamline order management, automate
    delivery fee calculation, apply intelligent discount rules, support scheduled orders, track costs, and
    generate business analytics.
  </p>

  <p>It targets small home-based food sellers and micro entrepreneurs, helping them:</p>
  <p>
    &#9679; Reduce human errors<br>
    &#9679; Save time<br>
    &#9679; Manage bulk and advance orders effectively<br>
    &#9679; Increase profitability through automated pricing rules<br>
    &#9679; Make better financial decisions using structured analytics
  </p>

  <hr/>

  <p><strong>4. Project Scope &amp; Features</strong><br>
    Core Features
  </p>

  <p><strong>Authentication &amp; Access</strong></p>
  <p>
    &#9679; Staff authentication (login required for staff access)<br>
    &#9679; Public product listing (customers can view products without login)<br>
    &#9679; Guest order placement (customers fill name, phone, email, and address)
  </p>

  <p><strong>Order &amp; Pricing Management</strong></p>
  <p>
    &#9679; Delivery fee calculation based on predefined delivery zones<br>
    &#9679; Order creation with automatic subtotal and total calculation<br>
    &#9679; Payment-before-confirmation workflow<br>
    &#9679; Order status management with controlled workflow:<br>
    &nbsp;&nbsp;&nbsp;&nbsp;CONFIRMED &rarr; COOKING &rarr; READY &rarr; COMPLETED<br>
    &#9679; Filtering and search for orders
  </p>

  <p><strong>Scheduled Orders</strong></p>
  <p>
    &#9679; Customers can select a preferred delivery date and time<br>
    &#9679; System validates advance order requirements<br>
    &#9679; Large-quantity dishes (see bulk rules below) may require at least 1-day advance scheduling
  </p>

  <p><strong>Bulk Discount System</strong><br>
    The system introduces automated bulk discount logic to encourage large orders while maintaining
    operational control.
  </p>

  <p><strong>A. Total Cart Quantity Discount</strong><br>
    Based on total number of dishes in the cart:
  </p>
  <p>
    &#9679; More than 10 dishes &rarr; 5% discount<br>
    &#9679; More than 15 dishes &rarr; 10% discount
  </p>

  <p><strong>B. Per-Product Bulk Discount &amp; Advance Rule</strong><br>
    If a single dish quantity exceeds certain thresholds:
  </p>
  <p>
    &#9679; More than 12 units of one dish:<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&#9679; Requires at least 1-day advance order<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&#9679; Gets 15% discount on that dish<br>
    &#9679; More than 20 units of one dish:<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&#9679; Requires at least 1-day advance order<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&#9679; Gets 25% discount on that dish
  </p>

  <p><strong>Discount Logic Priority</strong></p>
  <p>
    &#9679; Per-product bulk discount applies to individual qualifying items.<br>
    &#9679; Cart-level bulk discount applies to overall cart total.<br>
    &#9679; System must ensure discounts are calculated correctly without duplication errors.
  </p>

  <p><strong>Product Management</strong></p>
  <p>
    &#9679; Create, edit, delete products<br>
    &#9679; Manage selling price and cost of making<br>
    &#9679; Set product availability<br>
    &#9679; Upload product image
  </p>

  <p><strong>Delivery Zone Management</strong></p>
  <p>
    &#9679; Create delivery zones<br>
    &#9679; Configure delivery fee<br>
    &#9679; Define area keywords<br>
    &#9679; Activate/deactivate zones
  </p>

  <p><strong>Sales Analytics Dashboard</strong><br>
    Provides real-time business insights:
  </p>
  <p>
    &#9679; Total Sales<br>
    &#9679; Total Orders<br>
    &#9679; Best Seller<br>
    &#9679; Total Cost<br>
    &#9679; Total Revenue<br>
    &#9679; Sales Trend<br>
    &#9679; Sales by Product
  </p>

  <p><strong>Time-Based Analytics Grouping</strong></p>
  <p>
    &#9679; Daily (by hour)<br>
    &#9679; Weekly (by day)<br>
    &#9679; Monthly (by week)<br>
    &#9679; Yearly (by month)
  </p>

  <p><strong>5. Data Models</strong></p>

  <p><strong>Entity 1: StaffUser</strong><br>
    Fields:
  </p>
  <p>
    &#9679; name<br>
    &#9679; email<br>
    &#9679; password<br>
    &#9679; role<br>
    &#9679; createdAt<br>
    &#9679; updatedAt
  </p>
  <p>Operations:<br>
    Create, Read, Update, Delete
  </p>

  <p><strong>Entity 2: Product</strong><br>
    Fields:
  </p>
  <p>
    &#9679; name<br>
    &#9679; description<br>
    &#9679; price<br>
    &#9679; costToMake<br>
    &#9679; category<br>
    &#9679; isAvailable<br>
    &#9679; isSoldOut<br>
    &#9679; imageUrl<br>
    &#9679; madeWith<br>
    &#9679; createdAt<br>
    &#9679; updatedAt
  </p>
  <p>Operations:<br>
    Create, Read, Update, Delete
  </p>

  <p><strong>Entity 3: Order</strong><br>
    Fields:
  </p>
  <p>
    &#9679; customerName<br>
    &#9679; customerPhone<br>
    &#9679; customerEmail<br>
    &#9679; deliveryAddress<br>
    &#9679; orderNote<br>
    &#9679; scheduledDateTime<br>
    &#9679; items<br>
    &#9679; subtotal<br>
    &#9679; bulkDiscount<br>
    &#9679; deliveryFee<br>
    &#9679; totalAmount<br>
    &#9679; paymentStatus<br>
    &#9679; status<br>
    &#9679; createdAt<br>
    &#9679; updatedAt
  </p>
  <p>Operations:<br>
    Create, Read, Update, Delete
  </p>

  <p><strong>Entity 4: DeliveryZone</strong><br>
    Fields:
  </p>
  <p>
    &#9679; zoneName<br>
    &#9679; areaKeywords<br>
    &#9679; fee<br>
    &#9679; isActive<br>
    &#9679; createdAt<br>
    &#9679; updatedAt
  </p>
  <p>Operations:<br>
    Create, Read, Update, Delete
  </p>

  <hr/>

  <p><strong>6. Technology Stack</strong><br>
    Frontend: React.js<br>
    Backend: Next.js<br>
    Database: MongoDB<br>
    Deployment: Azure
  </p>

  <hr/>

  <p><strong>Staff Login</strong><br>
    Email - john@example.com
    Password - john12345
    <br>
    Email - james@example.com
    Password - james12345
    <br>
    Email - melida@example.com
    Password - melida12345
  </p>
    

</body>
</html>
