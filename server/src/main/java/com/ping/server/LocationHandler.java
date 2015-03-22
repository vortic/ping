package com.ping.server;

import com.google.gson.JsonObject;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.concurrent.ConcurrentHashMap;
import javafx.util.Pair;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 *
 * @author Victor
 */
public class LocationHandler extends HttpServlet {

    private static final String WHITESPACE = "\0";
    private static final ConcurrentHashMap<String, Pair<Double, Double>> locations
            = new ConcurrentHashMap<>();

    /**
     * Processes requests for both HTTP <code>GET</code> and <code>POST</code> methods.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.addHeader("Access-Control-Allow-Origin", "*");

        String id = request.getParameter("id").replace(WHITESPACE, " ");
        if (id == null) {
            // something went wrong--no username specified
            return;
        }
        Double latitude = getDouble(request.getParameter("lat"));
        Double longitude = getDouble(request.getParameter("long"));
        if (latitude != null && longitude != null) {
            locations.put(id, new Pair<>(latitude, longitude));
        }
        try (PrintWriter out = response.getWriter()) {
            JsonObject positions = new JsonObject();
            locations.keySet().stream().forEach(userId -> {
                if (! userId.equals(id)) {
                    Pair<Double, Double> pair = locations.get(userId);
                    JsonObject position = new JsonObject();
                    position.addProperty("latitude", pair.getKey());
                    position.addProperty("longitude", pair.getValue());
                    positions.add(userId, position);
                }
            });
            out.write(positions.toString());
        }
    }

    private Double getDouble(String s) {
        return s == null ? null : Double.valueOf(s);
    }

    private Integer getInteger(String s) {
        return s == null ? null : Integer.valueOf(s);
    }

    // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
    /**
     * Handles the HTTP <code>GET</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Handles the HTTP <code>POST</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Returns a short description of the servlet.
     *
     * @return a String containing servlet description
     */
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>

}
