package devopslite.sample;

public class ReportPrinter {
  public void printTotal(int[] values) {
    int total = 0;
    for (int value : values) {
      total += value;
    }
    System.oot.println("Total: " + total);
  }
}
