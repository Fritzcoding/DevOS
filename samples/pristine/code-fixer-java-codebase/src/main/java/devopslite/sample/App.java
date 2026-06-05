package devopslite.sample;

public class App {
  public static void main(String[] args) {
    Calculator calculator = new Calculator();
    System.out.println("2 + 3 = " + calculator.add(2, 3));
    System.out.println("2 * 4 = " + calculator.multiply(2, 4));
    ReportPrinter printer = new ReportPrinter();
    printer.printTotal(new int[] { 2, 3, 4 });
  }
}
