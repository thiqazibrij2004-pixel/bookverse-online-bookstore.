package com.bookstore.servlet.order;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.bookstore.model.order.Order;
import com.bookstore.model.order.OrderManager;
import com.bookstore.model.order.OrderStatus;

@WebServlet("/order-history")
public class OrderHistoryServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private OrderManager orderManager;

    @Override
    public void init() throws ServletException {
        // Initialize OrderManager with ServletContext
        orderManager = new OrderManager(getServletContext());
        System.out.println("OrderHistoryServlet initialized");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // Prevent caching
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setDateHeader("Expires", 0);

        // Get user session
        HttpSession session = request.getSession(false);

        // Debug logging
        System.out.println("OrderHistoryServlet: doGet method started");

        // Check if user is logged in
        if (session == null) {
            System.out.println("No session found, redirecting to login");
            response.sendRedirect(request.getContextPath() + "/login");
            return;
        }

        // Try to get userId from different possible session attributes
        String userId = (String) session.getAttribute("userId");
        if (userId == null) {
            userId = (String) session.getAttribute("user_id");
        }
        if (userId == null) {
            userId = (String) session.getAttribute("loggedInUserId");
        }

        // Check if user is logged in
        if (userId == null) {
            System.out.println("OrderHistoryServlet: User not logged in (userId is null), redirecting to login page");
            session.setAttribute("redirectAfterLogin", request.getContextPath() + "/order-history");
            response.sendRedirect(request.getContextPath() + "/login");
            return;
        }

        System.out.println("OrderHistoryServlet: userId = " + userId);

        // Debug: Print all session attributes
        System.out.println("OrderHistoryServlet: Session attributes:");
        java.util.Enumeration<String> attributeNames = session.getAttributeNames();
        while (attributeNames.hasMoreElements()) {
            String name = attributeNames.nextElement();
            Object value = session.getAttribute(name);
            System.out.println("  " + name + " = " + value);
        }

        // Force reload of orders to get latest data
        orderManager = new OrderManager(getServletContext());

        // Set OrderStatus array as an attribute for the JSP
        OrderStatus[] statuses = OrderStatus.values();
        request.setAttribute("statuses", statuses);

        // Get status filter parameter
        String statusFilter = request.getParameter("status");
        System.out.println("OrderHistoryServlet: statusFilter = " + statusFilter);

        // Fetch orders - ONLY FOR THE CURRENT USER
        List<Order> orders = new ArrayList<>();
        try {
            // Get all orders first for debugging
            List<Order> allOrders = orderManager.getAllOrders();
            System.out.println("OrderHistoryServlet: Total orders in system: " + allOrders.size());

            // Debug: Print all orders with their user IDs
            for (Order order : allOrders) {
                System.out.println("System Order: ID=" + order.getOrderId() +
                        ", UserID='" + order.getUserId() + "'" +
                        ", Status=" + order.getStatus());
            }

            // Get only the current user's orders
            orders = orderManager.getOrdersByUser(userId);
            System.out.println("OrderHistoryServlet: Found " + orders.size() + " orders for user: " + userId);

            // Then filter by status if needed
            if (statusFilter != null && !statusFilter.isEmpty()) {
                try {
                    OrderStatus status = OrderStatus.valueOf(statusFilter.toUpperCase());
                    System.out.println("Filtering orders by status: " + status);

                    List<Order> filteredOrders = new ArrayList<>();
                    for (Order order : orders) {
                        if (order.getStatus() == status) {
                            filteredOrders.add(order);
                        }
                    }
                    orders = filteredOrders;
                    System.out.println("Found " + orders.size() + " orders after status filtering");
                } catch (IllegalArgumentException e) {
                    // Invalid status, keep all orders
                    System.out.println("Invalid status filter: " + statusFilter + ", showing all orders");
                }
            }

            // Debug orders list
            if (orders != null && !orders.isEmpty()) {
                System.out.println("OrderHistoryServlet: User's order details:");
                for (Order order : orders) {
                    System.out.println("  Order ID: " + order.getOrderId() +
                            ", User ID: " + order.getUserId() +
                            ", Status: " + order.getStatus() +
                            ", Items: " + (order.getItems() != null ? order.getItems().size() : 0) +
                            ", Total: " + order.getTotal());
                }
            } else {
                System.out.println("OrderHistoryServlet: No orders found for user ID: " + userId);

                // Let's check if the issue is with string comparison
                System.out.println("OrderHistoryServlet: Checking for potential user ID matching issues...");
                for (Order order : allOrders) {
                    String orderUserId = order.getUserId();
                    if (orderUserId != null) {
                        System.out.println("Comparing: '" + userId + "' vs '" + orderUserId + "'");
                        System.out.println("  Length: " + userId.length() + " vs " + orderUserId.length());
                        System.out.println("  Equals: " + userId.equals(orderUserId));
                        System.out.println("  Equals (ignore case): " + userId.equalsIgnoreCase(orderUserId));

                        // Check for any hidden characters
                        for (int i = 0; i < Math.min(userId.length(), orderUserId.length()); i++) {
                            char c1 = userId.charAt(i);
                            char c2 = orderUserId.charAt(i);
                            if (c1 != c2) {
                                System.out.println("  First difference at position " + i + ": '" + c1 + "' vs '" + c2 + "'");
                                break;
                            }
                        }
                    }
                }
            }

            // Verify order totals to avoid null values
            if (orders != null) {
                for (Order order : orders) {
                    if (order.getTotal() == 0 && order.getItems() != null && !order.getItems().isEmpty()) {
                        // Recalculate totals if they appear to be missing
                        order.calculateTotals();
                        System.out.println("Recalculated totals for order: " + order.getOrderId());
                    }

                    // Ensure there are items in the order
                    if (order.getItems() == null) {
                        order.setItems(new ArrayList<>());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("OrderHistoryServlet: Error fetching orders: " + e.getMessage());
            e.printStackTrace();
            orders = new ArrayList<>();
            session.setAttribute("errorMessage", "An error occurred while fetching your orders: " + e.getMessage());
        }

        // Set attributes for the JSP
        request.setAttribute("orders", orders);
        request.setAttribute("statusFilter", statusFilter);

        System.out.println("OrderHistoryServlet: Forwarding to order-history.jsp with " + orders.size() + " orders");

        // Forward to order history page
        request.getRequestDispatcher("/order/order-history.jsp").forward(request, response);
    }
}