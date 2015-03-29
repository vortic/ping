package com.ping.server;

import com.google.gson.JsonObject;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.concurrent.ConcurrentHashMap;
import javafx.util.Pair;
import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;

/**
 *
 * @author Victor
 */
@MultipartConfig
public class LocationHandler extends HttpServlet {

    private static final String WHITESPACE = "\0";
    private static final ConcurrentHashMap<String, Pair<Double, Double>> locations
            = new ConcurrentHashMap<>();

    /**
     * Processes requests for both HTTP <code>GET</code> methods.
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

        try (PrintWriter out = response.getWriter()) {
            String id = getUsername(request);
            if (id == null) {
                warning(String.format("no username specified for request %s--location not stored.",
                                request));
            }
            Double latitude = getDouble(request.getParameter("lat"));
            Double longitude = getDouble(request.getParameter("long"));
            if (id != null && latitude != null && longitude != null) {
                locations.put(id, new Pair<>(latitude, longitude));
            }
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

    private String getUsername(HttpServletRequest request) {
        String s = request.getParameter("id");
        return s == null ? null : s.replace(WHITESPACE, " ");
    }

    private void warning(String string) {
        System.out.println("WARNING: " + string);
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
        response.setContentType("application/json");
        response.addHeader("Access-Control-Allow-Origin", "*");
        Part filePart = request.getPart("file");
        if (filePart == null) {
            warning("No image specified");
            return;
        }
        File file = new File("../www/img/mugshot_tmp.jpeg");
        try (InputStream fileContent = filePart.getInputStream()) {
            Files.copy(fileContent, file.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }
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
