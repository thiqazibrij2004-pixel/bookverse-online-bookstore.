# 📚 Online Bookstore Management System

A comprehensive Java web application for managing an online bookstore, featuring inventory management, user accounts, shopping carts, wishlists, order processing, and a review system.

## 🌟 Features

The Online Bookstore System is built with seven primary components:

### 1. 👤 User Management
- User registration and authentication
- User profiles (Regular and Premium)
- Account upgrade options
- Profile updates

### 2. 🛒 Cart Management
- Add items to cart
- Update quantities
- Remove items
- Cart persistence between sessions

### 3. ❤️ Wishlist Management
- Create multiple wishlists
- Add/remove books from wishlists
- Set priorities for items
- Public/private wishlist options

### 4. 📦 Order Management
- Checkout process
- Payment processing
- Order history
- Order tracking
- Order cancellation

### 5. ⭐ Review System
- Add reviews for books
- Rate books (1-5 stars)
- Edit and delete reviews
- View reviews by book or by user

### 6. 📖 Book Management
- Comprehensive book catalog
- Book details and cover images
- Categories and genres
- Search and filter
- Support for physical books and ebooks

### 7. 👨‍💼 Admin Panel
- Dashboard with statistics
- Book inventory management
- Order processing
- User management
- Admin account management

## 🛠️ Technologies

- **Java** - Core programming language
- **JSP** - JavaServer Pages for dynamic content
- **Servlets** - Java HTTP request handlers
- **Custom Data Structures** - LinkedList implementation
- **Custom Algorithms** - QuickSort implementation
- **File-based Storage** - Text files for data persistence

## 📋 System Requirements

- JDK 8 or higher
- Apache Tomcat 9.x
- Maven 3.6.x
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Installation & Setup

### Prerequisites
- Install [JDK](https://www.oracle.com/java/technologies/javase-downloads.html)
- Install [Apache Tomcat](https://tomcat.apache.org/download-90.cgi)
- Install [Maven](https://maven.apache.org/download.cgi)

### Setting Up the Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/online-bookstore.git
   cd online-bookstore
   ```

2. Build the project using Maven:
   ```bash
   mvn clean install
   ```

3. Deploy the WAR file to Tomcat:
   - Copy the generated `onlinebookstore.war` from the `target` folder to Tomcat's `webapps` directory
   - Or configure your IDE to deploy directly to Tomcat

4. Start Tomcat:
   ```bash
   cd path/to/tomcat
   ./bin/startup.sh  # For Linux/Mac
   .\bin\startup.bat  # For Windows
   ```

5. Access the application:
   ```
   http://localhost:8080/onlinebookstore/
   ```

## 📁 Project Structure

```
src/main/java/com/bookstore/
│
├── model/                  # Business logic and data models
│   ├── admin/              # Admin models
│   ├── book/               # Book models with LinkedList implementation
│   ├── cart/               # Shopping cart models
│   ├── order/              # Order and payment models
│   ├── review/             # Review models
│   ├── user/               # User models with inheritance
│   └── wishlist/           # Wishlist models
│
├── servlet/                # Servlet controllers
│   ├── admin/              # Admin area controllers
│   ├── book/               # Book-related controllers
│   ├── cart/               # Cart controllers
│   ├── order/              # Order processing controllers
│   ├── review/             # Review controllers
│   ├── user/               # User account controllers
│   └── wishlist/           # Wishlist controllers
│
├── filter/                 # Servlet filters
│   └── AdminAuthFilter.java # Authentication for admin area
│
└── util/                   # Utility classes
    ├── LinkedList.java     # Generic linked list implementation
    ├── QuickSort.java      # Sorting algorithm implementation
    ├── ValidationUtil.java # Input validation utilities
    └── PasswordUtil.java   # Password handling utilities
```

```
src/main/webapp/
│
├── admin/                  # Admin interface pages
│   ├── order/              # Order management pages
│   ├── dashboard.jsp       # Admin dashboard
│   ├── login.jsp           # Admin login
│   └── manage-books.jsp    # Book management
│
├── book/                   # Book catalog pages
│   ├── book-catalog.jsp    # Book listing
│   ├── book-details.jsp    # Individual book details
│   └── top-books.jsp       # Featured/Top books
│
├── includes/               # Shared page components
│   ├── footer.jsp          # Page footer
│   └── header.jsp          # Page header with navigation
│
├── order/                  # Order pages
│   ├── checkout.jsp        # Checkout process
│   ├── order-history.jsp   # User's order history
│   └── payment-form.jsp    # Payment processing
│
├── review/                 # Review pages
│   ├── add-review.jsp      # Add a review
│   └── book-reviews.jsp    # Reviews for a book
│
├── user/                   # User account pages
│   ├── login.jsp           # User login
│   ├── profile.jsp         # User profile
│   └── register.jsp        # User registration
│
├── wishlist/               # Wishlist pages
│   ├── create-wishlist.jsp # Create a wishlist
│   └── wishlists.jsp       # User's wishlists
│
├── WEB-INF/                # Web application config
│   └── data/               # Data storage files
│
├── cart.jsp                # Shopping cart page
└── index.jsp               # Homepage
```

## 📊 Data Storage

The application uses text files for data persistence, located in the `WEB-INF/data/` directory:

- `admins.txt` - Administrator accounts
- `books.txt` - Book inventory
- `carts.txt` - Shopping cart data
- `orders.txt` - Order details
- `order_items.txt` - Items within orders
- `payments.txt` - Payment records
- `reviews.txt` - Book reviews
- `users.txt` - User accounts
- `wishlists.txt` - Wishlist information
- `wishlist_items.txt` - Items within wishlists

## Local account setup

No credentials are published. See [LOCAL_AUTH_SETUP.md](../LOCAL_AUTH_SETUP.md) to create private local development accounts.

## 🔧 Implementation Details

### Custom Data Structures
- **LinkedList**: A generic doubly-linked list implementation is provided in `LinkedList.java`, with a specialized version for books in `BookLinkedList.java`
- **Book Node**: Custom node implementation for the book linked list in `BookNode.java`

### Sorting Algorithms
- **QuickSort**: Implementation in `QuickSort.java` for sorting books by various criteria (price, rating, etc.)

### Key Object-Oriented Concepts

1. **Inheritance**:
   - `RegularUser` and `PremiumUser` extend `User`
   - `EBook` and `PhysicalBook` extend `Book`

2. **Polymorphism**:
   - Different pricing methods for different book types
   - Various user privileges based on account type

3. **Encapsulation**:
   - Private fields with public getters/setters
   - Data validation within model classes

4. **Composition**:
   - `Order` contains `OrderItem` objects
   - `Wishlist` contains `WishlistItem` objects

## 🧪 Testing

To run the tests:

```bash
mvn test
```

The application includes unit tests for core functionality.

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with all core components
- File-based storage implementation
- Admin and user interfaces
- Book catalog with search and filtering

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## 👥 Authors

- Hasindu Wanninayake

## 🙏 Acknowledgments

- SE1020 – Object Oriented Programming course
- Special thanks to all contributors and testers

## Restored local run (Windows / VS Code)

From the parent workspace folder, run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\onlinebookstore\scripts\run.ps1
```

Then open http://localhost:8080/onlinebookstore/. The runner builds the WAR and starts Tomcat 9.0.102 with JDK 17. Stop with Ctrl+C or run `onlinebookstore/scripts/stop.ps1`. VS Code tasks are also provided in the parent workspace.

Live records and covers are preserved outside the WAR in `.runtime/bookstore-data` and `.runtime/bookstore-covers` in the parent workspace. Back up those directories; the source data is only the initial snapshot. Use `-JavaHome`, `-MavenHome`, or `-TomcatHome` when tool locations differ.

See [PROJECT_RESTORATION_REPORT.md](../PROJECT_RESTORATION_REPORT.md) for environment setup, fixes, verification results, limitations, and isolated HTTP integration-test instructions. The original repository has no Java unit tests; the restoration adds `scripts/audit.mjs` and `scripts/smoke-test.mjs`.
