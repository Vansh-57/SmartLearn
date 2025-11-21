import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.PriorityQueue;

public class HybridBananas {
    
    static class Edge {
        int to;
        int cost;
        
        Edge(int to, int cost) {
            this.to = to;
            this.cost = cost;
        }
    }
    
    static class Node implements Comparable<Node> {
        int id;
        int energy;
        
        Node(int id, int energy) {
            this.id = id;
            this.energy = energy;
        }
        
        public int compareTo(Node other) {
            return Integer.compare(this.energy, other.energy);
        }
    }
    
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        
        int n = Integer.parseInt(br.readLine().trim());
        
        List<List<Edge>> graph = new ArrayList<List<Edge>>();
        for (int i = 0; i <= n; i++) {
            graph.add(new ArrayList<Edge>());
        }
        
        String line;
        int source = -1, destination = -1;
        
        while ((line = br.readLine()) != null) {
            line = line.trim();
            
            if (line.equals("break")) {
                continue;
            }
            
            String[] parts = line.split("\\s+");
            
            if (parts.length == 1) {
                if (source == -1) {
                    source = Integer.parseInt(parts[0]);
                } else {
                    destination = Integer.parseInt(parts[0]);
                    break;
                }
            } else {
                for (int i = 0; i < parts.length - 1; i++) {
                    int from = Integer.parseInt(parts[i]);
                    int to = Integer.parseInt(parts[i + 1]);
                    graph.get(from).add(new Edge(to, 1));
                }
            }
        }
        
        int result = dijkstra(graph, n, source, destination);
        System.out.println(result);
    }
    
    static int dijkstra(List<List<Edge>> graph, int n, int source, int dest) {
        int[] minEnergy = new int[n + 1];
        Arrays.fill(minEnergy, Integer.MAX_VALUE);
        minEnergy[source] = 0;
        
        PriorityQueue<Node> pq = new PriorityQueue<Node>();
        pq.add(new Node(source, 0));
        
        while (!pq.isEmpty()) {
            Node current = pq.poll();
            
            if (current.energy > minEnergy[current.id]) {
                continue;
            }
            
            for (Edge edge : graph.get(current.id)) {
                int newEnergy = current.energy + edge.cost;
                
                if (newEnergy < minEnergy[edge.to]) {
                    minEnergy[edge.to] = newEnergy;
                    pq.add(new Node(edge.to, newEnergy));
                }
            }
        }
        
        return minEnergy[dest] == Integer.MAX_VALUE ? -1 : minEnergy[dest];
    }
}
